# Tasks

Implementation groups 1–3 go to the `coder` subagent; group 4 goes to `tester` after Felipin approves the implementation; group 5 is the orchestrator's close.

## 1. Database (coder)

- [x] 1.1 Add `VETERINARIAN`, `RECEPTIONIST`, `ASSISTANT` to `UserRole` and `sessionVersion Int @default(0)` to `User` in `prisma/schema.prisma`, and create migration `add_user_roles_and_session_version`; verify the migration SQL only adds the enum values and the column
- [x] 1.2 Reset the dev DB and reload the catalog per design.md → Migration Plan step 2 (Felipin approved wiping dev data), and apply the migration to `solu_vet_test`; verify the species list endpoint returns the catalog on the dev DB
- [x] 1.3 Run `npm run prisma:generate -w apps/api` and verify `npm exec -w apps/api -- tsc --noEmit` passes

## 2. API (coder)

- [x] 2.1 Add `apps/api/src/lib/organization-limits.ts` with `USER_LIMIT_BY_ORGANIZATION_TYPE` (`INDEPENDENT: 1`, `CLINIC: 5`); verify it is the only place the number 5 appears in `apps/api/src` outside tests
- [x] 2.2 In `users.schemas.ts`, export `INVITABLE_ROLES` and change `inviteUserSchema.role` to `z.enum(INVITABLE_ROLES)`; verify `role: "OWNER"` fails parsing
- [x] 2.3 In `invitation-token.ts`, add the pending-invitation predicate helper and change `activateInvitation` to create the `User` from the invitation (rejecting when the email already has a `User`); verify by activating an invitation locally and logging in with it
- [x] 2.4 Rewrite `inviteUser` per design.md Decision 4 (no placeholder user, INDEPENDENT 403, org row lock, existing-user / pending-invitation / limit checks, messages as specified); verify with type check and the updated tests in 2.7
- [x] 2.5 Add `getSeats`, `cancelInvitation`, `removeUser` to `users.controller.ts` and their routes in `users.routes.ts` (all OWNER-only, `/invitations/:id` before `/:id`) per design.md Decision 5; verify with `curl`/REST calls against `npm run dev:api` for a clinic owner
- [x] 2.6 Implement design.md Decision 8: `sessionVersion` claim in `access-token.ts` (signed in `register`, `login`, `refresh`; `rotateRefreshToken` returns it), async `requireAuth` with the user lookup (missing user or version mismatch → 401, `req.auth` role/org from the DB row), and `logoutAll` / `confirmPasswordReset` incrementing `sessionVersion` in the same transaction that revokes refresh tokens; verify locally that after "logout all" a previously issued access token gets 401 on `GET /api/tutors`
- [x] 2.7 Implement design.md Decision 9 in `register` (pending invitation → 409 `field: "email"` with the spec message); verify with type check and the tests in 2.9
- [x] 2.8 Confirm `login` and `requestPasswordReset` need no change (a pending invitee has no `User`) and note it in the handoff
- [x] 2.9 Update the existing tests that assert replaced behavior so they reflect the new specs: `users.api.test.ts` (placeholder `User`, `role: "OWNER"`, inviting from an INDEPENDENT owner), activation tests in `auth.api.test.ts`, `require-auth.test.ts` (now async and DB-backed), and any test that signs an access token for a user that doesn't exist in the DB or without `sessionVersion`; verify `npm test -w apps/api` is green

## 3. Mobile (coder)

- [ ] 3.1 Create `src/features/users/` (`roles.ts`, `types/users.types.ts`, `api/users.api.ts`, `index.ts`) per design.md Decision 10; move `inviteUser` out of `features/auth/api/auth.api.ts` and `useInviteUser` out of `features/auth/hooks`, updating imports and the `features/auth` barrel; verify `npm exec -w apps/mobile -- tsc --noEmit`
- [ ] 3.2 Extend `useInviteUser` with the cargo (`role`) state, "Selecciona un cargo." validation and sending the chosen role; verify the existing auth hook tests that cover invite still pass after moving them with the hook
- [ ] 3.3 Add `useSeats` (load on focus, `limit`, `seats`, `isFull`, `cancelInvitation`, `removeUser` with reload) and `SeatsSection` (count "N de L", rows with name-or-email, Spanish cargo, "Activo"/"Invitación pendiente", confirm-then-act buttons, invite button or limit message "La clínica alcanzó el límite de L usuarios (tú + L-1 invitados).")
- [ ] 3.4 Update `cuenta.tsx`: use `roleLabels`, render `SeatsSection` only for OWNER of a CLINIC, remove the standalone invite button; verify on web as independent owner (no section), clinic owner (section) and staff user (no section)
- [ ] 3.5 Update `cuenta/invitar.tsx`: redirect to Cuenta when not OWNER, INDEPENDENT or full; add the `SegmentedButtons` cargo selector with no default; verify on web by opening `/cuenta/invitar` directly as an independent owner (redirects) and as a clinic owner (form)
- [ ] 3.6 Run `npm exec -w apps/mobile -- tsc --noEmit`, `npm run lint -w apps/mobile`, `npm exec -w apps/api -- tsc --noEmit` and `npm test -w apps/api`; all must pass before handing off to Felipin

## 4. Tests (tester, after Felipin approves)

- [ ] 4.1 API: invite happy path per role; OWNER role rejected (400); staff role forbidden on all four endpoints (403); INDEPENDENT forbidden (403); duplicate user email and pending-invitation email (409 with `field: "email"`); limit reached (409) with active users + pending invitations mixed; expired invitation frees a seat; concurrent invites at 4/5 → exactly one 201
- [ ] 4.2 API: activation creates the `User` with the invitation's role and org; cancelled invitation token rejected; activation rejected when the email was registered meanwhile; pending invitee cannot log in and gets no reset email
- [ ] 4.3 API: seats listing (limit, order, statuses, no other-org rows, no expired/accepted invitations); cancel invitation (success, other-org 404, non-pending 404); remove user (success → the removed user's current access token gets 401, login and refresh fail, email re-invitable; self 400; other-org 404)
- [ ] 4.3b API sessions and registration: after logout-all and after a password reset, an access token issued before gets 401 and a fresh login works; a token without `sessionVersion` gets 401; registering an email with a pending invitation → 409 `field: "email"` with the spec message, and succeeds once that invitation expired
- [ ] 4.4 Mobile unit tests (`jest-expo`) for `useInviteUser` (cargo required, sends role), `useSeats` (`isFull`, reload after cancel/remove) and `roleLabels` coverage of every role
- [ ] 4.5 Playwright e2e happy path: clinic owner invites a user choosing a cargo and sees the pending row in "Usuarios de la clínica"; verify `npx playwright test -c e2e` is green

## 5. Close (orchestrator)

- [ ] 5.1 Remove the "Only one role exists" entry from `PROJECT_STATUS.md` → Risks Pending; update `TASKS.md` (drop nothing unrelated; add as NEXT, in this order: (1) account self-service change — change password while logged in, reusing `sessionVersion` to close other sessions, and edit the user's name, evaluating asking it on activation (checklist ítems 1 y 6); (2) record-authorship change for Tutor, Patient and Consultation with `createdByUserId` + `createdByName` + `createdByEmail` per design.md Decision 7) and today's `DAILY/DAILY_LOG_YYYY-MM-DD.md`; verify no fact is duplicated with this change's design.md
- [ ] 5.2 Update ítems 3–5 of `checklist-tarea-add-auth-multitenancy.md` if Felipin wants them marked; commit with the `commit` skill
