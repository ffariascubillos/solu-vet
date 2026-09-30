# Proposal

## Why

Every invited user activates as `OWNER`, so the existing "only an OWNER invites" rule protects nothing, and there is no way to say what an invited person does in the practice. Independent veterinarians can invite users even though their organization is one person, and clinics can invite without limit, which blocks a future per-plan seat model. All three problems meet in `POST /api/users/invite`, so they are fixed together.

## What Changes

- Add staff roles `VETERINARIAN`, `RECEPTIONIST` and `ASSISTANT` next to `OWNER`. The inviting OWNER picks one of them; `OWNER` itself can no longer be invited, so each organization has exactly one OWNER. Staff roles get the same access as OWNER except managing members (fine-grained permissions stay out of scope).
- **BREAKING** (internal contract): `POST /api/users/invite` no longer accepts `role: "OWNER"`; it requires one of the staff roles.
- **BREAKING** (behavior): an invitation no longer creates a placeholder `User`. The `User` is created when the invitation is activated. A pending invitation therefore cannot be used to log in or to reset a password, and an expired invitation leaves nothing behind.
- Reject invitations from `INDEPENDENT` organizations in the backend and hide the invite entry point in mobile.
- Limit each `CLINIC` to 5 seats (the OWNER + 4). Active users and pending, unexpired invitations both take a seat. The per-organization-type limit lives in one backend setting and is returned by the API so mobile never hardcodes it.
- Reject an invitation whose email already has a pending, unexpired invitation, and reject self-registration with such an email (the person is told to activate the invitation instead, without revealing which organization sent it).
- New OWNER-only endpoints to list the organization's seats, cancel a pending invitation and remove (hard delete) a member other than themselves.
- Session revocation becomes immediate: "log out of all devices", a completed password reset and removing a member cut off every access token at once instead of letting it live up to 15 minutes.
- Mobile Cuenta: for a clinic OWNER, a "Usuarios de la clínica" section lists every seat (name or email, cargo, "Activo" / "Invitación pendiente") with cancel/remove actions, shows "Invitar usuario" while seats remain, and replaces it with the limit message when full. The invite screen gains a required cargo selector and redirects back to Cuenta when inviting is not allowed.
- Role and cargo labels are shown in Spanish everywhere (Propietario, Médico veterinario, Recepcionista, Asistente / TENS veterinario).

## Capabilities

### New Capabilities
- `user-roles`: the role set, the single-OWNER rule, and which actions are reserved to the OWNER.
- `organization-members`: seat limits per organization type, the seat listing, cancelling invitations, removing members, and the mobile team-management UI.

### Modified Capabilities
- `user-invitations`: the inviter picks a staff role; independent organizations cannot invite; an invitation no longer creates a `User` until activation; an email with a pending invitation cannot be invited again; activation creates the user.
- `user-authentication`: registration rejects an email with a pending invitation; protected endpoints reject tokens of removed users and of revoked sessions; "log out of all devices" and password reset take effect immediately on access tokens.

## Impact

- **Database**: one migration adds three `UserRole` values and a `User.sessionVersion` column. The dev database is reset (all test data wiped, catalog re-seeded) instead of migrating old invitation data; Felipin approved this.
- **API**: `apps/api/src/modules/users/*` (invite changes, new `GET /api/users/seats`, `DELETE /api/users/invitations/:id`, `DELETE /api/users/:id`); `apps/api/src/lib/auth/invitation-token.ts` (activation creates the user); new organization-limits setting in `apps/api/src/lib/`; `require-auth.ts` (one user lookup per request), `access-token.ts`, `refresh-token.ts` and `auth.controller.ts` (`register`, `logoutAll`, `confirmPasswordReset`).
- **Existing tests**: `users.api.test.ts`, `auth.api.test.ts` and `require-auth.test.ts` assert the old placeholder-user, `role: "OWNER"` and stateless-token behavior and must be updated.
- **Mobile**: `app/(drawer)/(tabs)/cuenta.tsx`, `cuenta/invitar.tsx`, invitation API/hook (moved from `features/auth` into a new `features/users`).
- **Docs**: the "Only one role exists" entry in `PROJECT_STATUS.md` → Risks Pending is resolved and removed at close.
- **Follow-up**: record authorship on Tutor/Patient/Consultation is a separate change; this change's hard delete must stay compatible with it (see design.md).
