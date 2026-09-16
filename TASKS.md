# TASKS.md

Active work queue. A finished item is deleted, not archived — it is already in `git log`.

## IN PROGRESS

- Authentication + multi-tenancy (`openspec/changes/add-auth-multitenancy/`): planning complete and validated (proposal, 4 capability specs, design, tasks). Mobile Login/Register screens mocked up (`apps/mobile/src/features/auth/`, `apps/mobile/app/(auth)/`), no backend wiring yet. Section 1 (Dependencies) done. Section 2 (Prisma schema and migration) done: `Organization`, rewritten `User` (`role`, `organizationId`), `RefreshToken`, `UserInvitation`, `PasswordResetToken` added; `Tutor`/`Patient`/`Consultation` now require `organizationId`, and `Tutor.rut`/`Tutor.email` are unique per organization. Dev/test tables were truncated instead of backfilled (no real data existed yet). **Known state: `apps/api` currently fails `tsc --noEmit` and its test suite for `tutors`/`patients`/`consultations`**, because those controllers don't set/filter `organizationId` yet — expected per `design.md`'s migration plan, fixed by Sections 6-8. Felipin approved leaving `master` red until then rather than reordering the phases. Section 3 (Auth infrastructure) done: password hashing (bcryptjs), access-token sign/verify (JWT, 15min), refresh-token issuance/rotation/reuse-detection, `requireAuth`/`requireRole` middlewares, `forOrganization` Prisma extension for tenant scoping, password-reset-token issuance/validation. Added a local-dev `JWT_SECRET` to `apps/api/.env` (gitignored). Section 4 (Auth endpoints) done: `register` (independent/clinic), `login`, `refresh`, `logout`, `logout-all`, `password-reset/request`, `password-reset/confirm`, mounted at `/api/auth`. Fixed a real bug found by the `tester`: two duplicate `EmailSender` implementations existed (an orphaned Fase-1 placeholder and the real Fase-3 one, never wired in); both eagerly constructed the Resend client at module load, so importing `app.js` with no `RESEND_API_KEY` configured crashed the entire API, breaking every test including the preexisting `tutor-patient.api.test.ts`. Consolidated on the real implementation (`apps/api/src/lib/email/`) and made client construction lazy; added `EMAIL_FROM`/`APP_URL` placeholders to `apps/api/.env` (`RESEND_API_KEY` still intentionally unset — no Resend account yet). 17 new auth unit tests, all green. Section 5 (User invitations) done: `POST /api/users/invite` (`requireAuth` + `requireRole("OWNER")`, pending `User` + `UserInvitation` created together, activation email sent) and `POST /api/auth/activate` (token validated, `acceptedAt` marked, and `User.passwordHash` set inside one `prisma.$transaction`, so a failed activation can't burn the token). Also added `apps/api/src/lib/env.ts` to centralize the `APP_URL` guard, now shared by `auth.controller.ts` and `users.controller.ts`. 30 new tests, all green (invite auth/role/duplicate-email cases, activation valid/expired/used/unknown-token cases, client can't override `organizationId`/`role`, transaction-rollback case, and a full register→invite→activate→login end-to-end test). Section 6 (Tenant isolation — Tutors) done: `tutorsRouter` now requires `requireAuth` on all 5 routes; `createTutor` sets `organizationId` from the token and checks rut/email duplicates via the compound unique keys (`rut_organizationId`/`email_organizationId`); `updateTutor`'s existence check uses the org-scoped `req.prisma` (404 for another org's tutor, no `organizationId` in the write itself — the prior scoped lookup already closes that window); `getTutors`/`searchTutors`/`getTutorById` all read through `req.prisma`, which auto-scopes `findMany`/`findFirst` by organization. 41 tests green (35 existing tutor tests fixed to authenticate + 6 new cross-organization isolation tests: RUT reuse across orgs, 404+unchanged record on cross-org update, list/search exclusion, cross-org detail 404). **Found, not fixed (belongs to Section 7): `patients.controller.ts`'s `createPatient` never sets `organizationId`, so every patient creation now 500s since the column became required in Section 2** — 11 `tutor-patient.api.test.ts` patient tests are red for this reason, unrelated to Section 6. Next: Section 7 (Tenant isolation — Patients), which also needs to fix this `organizationId` gap in `createPatient`.

## NEXT

### Backend

- [ ] Normalize validation error responses.
- [ ] Add an admin-only CRUD maintainer for species and breeds (create, search, update, delete). Depends on authentication with roles — tracked in the in-progress auth change above.

### Mobile

- [ ] Manually verify the Tutor/Patient edit screens on an Android phone via Expo Go: edit success, duplicate rut/email errors, species/breed cascade reset, validation errors.

### Testing

- None.

## Rules

1. Delete a finished item. `git log` is the history; do not keep a DONE list here.
2. Update `PROJECT_STATUS.md` only when a capability or a technical decision actually changed.
3. If the work went through OpenSpec, its rationale belongs in the change's `design.md`, not in `PROJECT_STATUS.md`.
4. Keep this file short and actionable.
