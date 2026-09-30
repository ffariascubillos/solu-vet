# Design

## Context

See proposal.md for motivation. Current state that shapes the approach:

- `POST /api/users/invite` (`apps/api/src/modules/users/users.controller.ts`) creates a placeholder `User` with a random password **and** a `UserInvitation` in one transaction. `activateInvitation` (`apps/api/src/lib/auth/invitation-token.ts`) only overwrites that user's `passwordHash`. Because the placeholder already exists, a never-activated invitee can use "forgot password" to get in, an expired invitation leaves a row that blocks its email forever, and counting seats would have to reason about half-created users.
- `UserRole` has one value (`OWNER`). `requireRole("OWNER")` guards the invite route; the role travels in the access token (`sub`, `organizationId`, `role`) and `rotateRefreshToken` re-reads it from the DB.
- `requireAuth` is stateless (JWT only), so an issued access token works for its full 15 minutes even after "log out of all devices" or a password reset. `RefreshToken`, `PasswordResetToken` and `UserInvitation.invitedByUserId` reference `User` without cascade.
- Mobile: `cuenta.tsx` shows "Invitar usuario" for any `OWNER`; `cuenta/invitar.tsx` + `features/auth/hooks/useInviteUser.ts` send `role: 'OWNER'` hardcoded. The session (`useAuth`) already holds `user.role` and `organization.type`.

## Goals / Non-Goals

**Goals:**
- Pending invitations are pure `UserInvitation` rows; a `User` exists only once someone activated or registered.
- One place defines the seat limit per organization type; one place (per app) defines the invitable roles and their labels.
- The backend is the only barrier: every rule (owner-only, independent, limit, same-org) holds without the app.

**Non-Goals:**
- Per-role permissions beyond "only the OWNER manages members".
- Re-sending an invitation, changing a member's role, transferring ownership.
- Revoking a single device's access token on plain logout (logout still only revokes that refresh token; the device discards its access token itself).
- Record authorship (separate change, see Decision 7).

## Decisions

### 1. Roles stay a Prisma enum
Add `VETERINARIAN`, `RECEPTIONIST`, `ASSISTANT` to `UserRole`. The backend exports `INVITABLE_ROLES = ["VETERINARIAN", "RECEPTIONIST", "ASSISTANT"] as const` from `users.schemas.ts` and the invite schema uses `z.enum(INVITABLE_ROLES)`, so `OWNER` is a 400. Mobile keeps a single `roleLabels` map and an `invitableRoles` list in `src/features/users/roles.ts`, used by Cuenta and the invite screen.

Adding a cargo later = one enum value + migration + one label + one list entry. **Alternative:** a `Role` table editable at runtime. Rejected for the MVP: needs CRUD and admin UI, and permissions would still be coded per role.

### 2. Invitation creates no User; activation does
`inviteUser` only inserts a `UserInvitation`. `activateInvitation(token, passwordHash)` validates the token as today, then inside the same transaction checks that no `User` has the email (else throws `InvitationTokenError` → the existing "El enlace no es válido o ya expiró." 400), creates the `User` (`email`, `role`, `organizationId` from the invitation, `name: null`) and sets `acceptedAt`.

"Pending" is defined once as `acceptedAt: null, expiresAt > now`, in a small exported helper (e.g. `pendingInvitationWhere()` in `invitation-token.ts`) reused by the invite duplicate check, the seat count and the seat listing.

**Alternative:** keep the placeholder and exclude users whose invitation expired. Rejected: expired rows still block the email, need cleanup on re-invite, and leave the forgot-password bypass open.

### 3. Seat limit setting
New `apps/api/src/lib/organization-limits.ts`:
```ts
export const USER_LIMIT_BY_ORGANIZATION_TYPE: Record<OrganizationType, number> = { INDEPENDENT: 1, CLINIC: 5 }
```
Seats used = `user.count({ organizationId })` + `userInvitation.count({ organizationId, ...pending })`. The limit is returned by `GET /api/users/seats`, so mobile never hardcodes 5. A future subscription plan replaces this lookup without touching callers.

### 4. Invite endpoint order of checks
`POST /api/users/invite` (`requireAuth`, `requireRole("OWNER")`):
1. Zod parse (email + invitable role) → 400.
2. Load the organization; `INDEPENDENT` → 403 "Las cuentas de veterinario independiente no pueden invitar usuarios." Explicit check rather than relying on the limit of 1, so the message is accurate.
3. Inside `prisma.$transaction`: lock the organization row with `SELECT id FROM "Organization" WHERE id = $1 FOR UPDATE` (`tx.$queryRaw`), then
   - existing `User` with the email → 409 "Ya existe una cuenta con este correo." `field: "email"` (unchanged message);
   - pending invitation for the email in any org → 409 "Ya hay una invitación pendiente para este correo." `field: "email"`;
   - seats used ≥ limit → 409 "La clínica alcanzó el límite de {limit} usuarios.";
   - create the invitation.
4. Send the email outside the transaction (unchanged).

The row lock serializes concurrent invites of one organization so the count can't be read stale. **Alternative:** Serializable isolation + retry. Rejected: needs retry handling for a one-line problem. The duplicate-email checks run inside the transaction too, so they return from the transaction callback as a result value rather than throwing a response.

### 5. New endpoints (all `requireAuth` + `requireRole("OWNER")`, in `users.routes.ts`)
- `GET /api/users/seats` → `{ ok, data: { limit, seats: [{ id, kind: "USER" | "INVITATION", name, email, role, status: "ACTIVE" | "PENDING" }] } }`, users first ordered by `createdAt`, then pending invitations by `createdAt`. Uses the org-scoped queries on `req.auth.organizationId`.
- `DELETE /api/users/invitations/:id` → finds a pending invitation with that id **and** the caller's `organizationId`; missing → 404; else deletes the row (the token then resolves to "unknown", which activation already rejects). Deleting instead of a `cancelledAt` column keeps "pending" a two-field predicate; nothing needs the history today.
- `DELETE /api/users/:id` → `id === req.auth.userId` → 400 "No puedes darte de baja a ti mismo."; user not found in caller's org → 404; else one transaction deletes the user's `RefreshToken`s, `PasswordResetToken`s, `UserInvitation`s where `invitedByUserId` is the user, and the `User`.

Route order: register `/invitations/:id` before `/:id`. 404 messages: "No se encontró la invitación." / "No se encontró el usuario."

### 6. Removal is a hard delete
The user row and its tokens are deleted in one transaction (Decision 5). The removed user is cut off on their next request by Decision 8 (their id no longer resolves). Deleting invitations the user sent is defensive: only the OWNER sends invitations and the OWNER can't be removed, but it keeps the FK from ever blocking the delete.

### 7. Compatibility with future record authorship
"Hard delete" means the `User` row disappears. Today nothing points at a user — no tutor, patient or consultation stores who created it — so removing one loses nothing else.

The follow-up change will make records point at users, e.g. a consultation "Atendida por Dra. Pérez". If that consultation only stored her user id and she is later removed, it would no longer know who attended it. To avoid that, the follow-up adds to Tutor/Patient/Consultation a **nullable** `createdByUserId` FK with `onDelete: SetNull` **plus** `createdByName` and `createdByEmail`, copies of the author's name and email taken at creation (Felipin wants both kept after removal). After removing Dra. Pérez the id becomes empty but the record still reads "Atendida por Dra. Pérez (perez@clinica.cl)". That change must not add a required FK to `User`, or removing members would start failing.

### 8. Immediate session revocation via `User.sessionVersion`
Add `sessionVersion Int @default(0)` to `User` and a `sessionVersion` claim to the access token (`AccessTokenPayload`, signed in `register`, `login` and `refresh`; `rotateRefreshToken` returns it alongside `role`).

`requireAuth` becomes async: after verifying the signature it loads `prisma.user.findUnique({ where: { id: sub }, select: { organizationId, role, sessionVersion } })`. It returns 401 "Invalid or expired token" when the user is missing or its `sessionVersion` differs from the claim (a token without the claim counts as different). `req.auth.role` and `organizationId` come from that row, so role changes also apply at once.

`logoutAll` and `confirmPasswordReset` increment `sessionVersion` in the same transaction that revokes the refresh tokens. Removal needs nothing extra: the row is gone.

Mobile needs no change: a 401 triggers the existing refresh interceptor, refresh fails because the refresh tokens were revoked, and the app returns to login.

**Alternatives:** a `sessionsRevokedAt` timestamp compared to the token's `iat` (rejected: `iat` has one-second resolution, so a token issued in the same second as the revocation would slip through); a revoked-token denylist (rejected: more storage and cleanup for the same result); a shorter access-token lifetime (rejected: narrows the window but doesn't close it). **Cost:** one primary-key lookup per authenticated request, about 1 ms locally; acceptable for the MVP and it can be cached later if needed.

### 9. Registration checks pending invitations
`register` adds a check after the existing-user check: a pending invitation (Decision 2 predicate) for the email → 409 `field: "email"` with the message in the user-authentication spec. It does not name the organization: registration doesn't verify the email belongs to the person typing it, so naming the clinic would tell anyone who invited that address. Big multi-workspace apps (Slack, Notion) let the person keep both, but here a user belongs to exactly one organization, so blocking avoids an accidental empty second practice. Mobile shows the API message through the existing register error handling.

### 10. Mobile structure
New `src/features/users/` (per CLAUDE.md, invite code moves here because it is being touched):
- `api/users.api.ts` — `inviteUser(email, role)`, `getSeats()`, `cancelInvitation(id)`, `removeUser(id)`; error messages still read through the existing `getAuthErrorMessage` from `features/auth`.
- `roles.ts` — `roleLabels`, `invitableRoles`.
- `types/users.types.ts` — `Seat`, `SeatsData`, `InvitableRole`.
- `hooks/useInviteUser.ts` (moved from `features/auth/hooks`, adds `role` state and the "Selecciona un cargo." validation), `hooks/useSeats.ts` (loads seats, exposes `cancelInvitation`/`removeUser` that reload after success, `isFull`).
- `components/SeatsSection.tsx` — the "Usuarios de la clínica" card with rows, actions (confirm via `window.confirm` on web / `Alert.alert` on native, same pattern as `handleLogoutAll`), invite button or limit message.
- `index.ts`.

`cuenta.tsx`: uses `roleLabels`; renders `<SeatsSection />` only when `user.role === 'OWNER' && organization.type === 'CLINIC'`; drops its own invite button. `useSeats` reloads on focus (`useFocusEffect`) so returning from the invite screen shows the new pending row.
`cuenta/invitar.tsx`: `<Redirect href="/cuenta" />` when the user isn't OWNER, the org is `INDEPENDENT`, or `useSeats` reports full; renders a `SegmentedButtons` (react-native-paper, same component family as `OrganizationTypeToggle`) with the three cargos and no default. After a successful invite the screen reloads seats, so reaching the limit redirects back.

## Risks / Trade-offs

- [One extra DB query per authenticated request] → primary-key lookup, negligible at MVP scale; can be cached later without changing the contract.
- [Every access token issued before the deploy lacks the `sessionVersion` claim] → treated as revoked; clients silently refresh once. Irrelevant anyway after the dev DB reset.
- [A user registers while an invitation for their email is being created, or vice versa] → activation still refuses to create a second `User` for an existing email (user-invitations spec), so the race ends in the invalid-link message, never a duplicate account.
- [Existing tests encode the old behavior, and some sign tokens for users that don't exist in the DB] → updated in the implementation tasks so `npm test` stays green before handing off to Felipin.
- [Removing a member deletes their account permanently] → safe today; Decision 7 explains how the authorship follow-up stays compatible.

## Migration Plan

1. One migration `add_user_roles_and_session_version`: adds the three `UserRole` values and `User.sessionVersion` (`npm run prisma:migrate -w apps/api`). New enum values are not used inside the migration, so one migration is enough.
2. Reset the dev database with `npm exec -w apps/api -- prisma migrate reset` and then run `npm run prisma:seed -w apps/api` to reload the species catalog (the seed is idempotent, so running it after a reset that already seeded is harmless). Felipin approved wiping all dev data; this replaces migrating the placeholder users and extra OWNERs of the old invite flow. Everyone registers again afterward.
3. Apply the migration to `solu_vet_test` (see CLAUDE.md), then `npm run prisma:generate -w apps/api`.

Rollback: revert the code and the migration; the wiped dev data is not recoverable, which is accepted.
