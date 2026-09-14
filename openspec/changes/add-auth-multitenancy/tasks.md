## 1. Dependencies

- [x] 1.1 Add `jsonwebtoken`, `bcryptjs` and their `@types/*` packages to `apps/api/package.json`; verify `npm exec -w apps/api -- tsc --noEmit` succeeds with the new imports available.
- [x] 1.2 Add the Resend SDK (or the confirmed alternative, per design.md Decision 5) to `apps/api/package.json`, gated behind the `EmailSender` interface described in design.md; verify the package installs and a placeholder `sendActivationEmail` call type-checks.
- [x] 1.3 Add `expo-secure-store` to `apps/mobile/package.json`; verify `npx expo install expo-secure-store` completes without dependency conflicts.

## 2. Prisma schema and migration

- [ ] 2.1 Add `Organization` model (`id`, `name`, `type: OrganizationType`, `trialEndsAt`, `subscriptionStatus: SubscriptionStatus`, `createdAt`, `updatedAt`) and the `OrganizationType`/`SubscriptionStatus` enums to `apps/api/prisma/schema.prisma`, per `specs/organizations/spec.md`.
- [ ] 2.2 Rewrite `User` model: add `role: UserRole` (enum with only `OWNER` for now) and `organizationId` (relation to `Organization`); verify the model compiles with `npm run prisma:generate -w apps/api`.
- [ ] 2.3 Add nullable `organizationId` to `Tutor`, `Patient`, `Consultation` (relation to `Organization`) in a first migration step, per design.md's Migration Plan step 2; verify `npm run prisma:migrate -w apps/api` creates and applies the migration cleanly against the dev database.
- [ ] 2.4 Seed or backfill development/test data with a placeholder `Organization` so existing local rows are not orphaned, per design.md's Migration Plan step 3; verify no `Tutor`/`Patient`/`Consultation` row has a null `organizationId` afterward.
- [ ] 2.5 Make `organizationId` required and add `@@index([organizationId])` on `Tutor`, `Patient`, `Consultation` in a follow-up migration; verify the migration applies without constraint violations against the backfilled data.
- [ ] 2.6 Replace `Tutor.rut`/`Tutor.email` global `@unique` with `@@unique([rut, organizationId])` / `@@unique([email, organizationId])` in the same migration as 2.5; verify by inserting two tutors with the same RUT in two different organizations directly via Prisma Studio or a script, confirming both succeed.
- [ ] 2.7 Add a new `RefreshToken` model (`id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`, `replacedByTokenId`, `createdAt`) per design.md Decision 1; verify it migrates cleanly and is indexed on `userId`.
- [ ] 2.8 Add a new `UserInvitation` model (`id`, `email`, `organizationId`, `role`, `tokenHash`, `expiresAt`, `acceptedAt`, `invitedByUserId`, `createdAt`) per `specs/user-invitations/spec.md`; verify it migrates cleanly.
- [ ] 2.9 Add a new `PasswordResetToken` model (`id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt`) per design.md Decision 7; verify it migrates cleanly and is indexed on `userId`.

## 3. Auth infrastructure

- [ ] 3.1 Implement password hashing helpers (`hashPassword`, `verifyPassword`) using `bcryptjs`, per design.md Decision 3; verify with a unit test that a correct password verifies and an incorrect one does not.
- [ ] 3.2 Implement access-token issuance and verification (`signAccessToken`, `verifyAccessToken`) embedding `{ sub, organizationId, role }` with a 15-minute expiry, per design.md Decision 2; verify with a unit test that an expired token fails verification.
- [ ] 3.3 Implement refresh-token issuance, hashing-at-rest, rotation and reuse detection against the `RefreshToken` table, per design.md Decision 1; verify with a test that reusing an already-rotated refresh token revokes the whole token lineage.
- [ ] 3.4 Implement `requireAuth` middleware: verifies the access token, rejects missing/malformed/expired tokens with 401, and attaches `req.auth = { userId, organizationId, role }`; verify with a test hitting a protected route with no token, an expired token, and a valid token.
- [ ] 3.5 Implement `requireRole(...)` middleware for role-gated routes (used by the invite endpoint); verify with a test that a non-`OWNER` request is rejected.
- [ ] 3.6 Implement the `forOrganization(organizationId)` Prisma client extension described in design.md Decision 4, scoping `findMany`/`findFirst`/`updateMany`/`deleteMany` on `Tutor`, `Patient`, `Consultation` to the given `organizationId`; verify with a test that a scoped client cannot see another organization's rows even when queried without an explicit filter.
- [ ] 3.7 Wire `requireAuth` to attach a per-request scoped client (`req.prisma = prisma.$extends(forOrganization(req.auth.organizationId))`); verify `req.prisma` is available in a downstream handler in a request test.
- [ ] 3.8 Implement the `EmailSender` interface and its Resend-backed implementation (or confirmed alternative), reading the API key from an environment variable; verify with a test using a fake/mock implementation that the invitation flow calls it with the expected recipient and activation URL.
- [ ] 3.9 Implement password-reset-token issuance, hashing-at-rest and single-use validation against the `PasswordResetToken` table, per design.md Decision 7 (mirrors 3.3's hashing approach, without rotation since a reset token is consumed once, not exchanged repeatedly); verify with a test that an already-used token is rejected on a second attempt.

## 4. Auth endpoints (`apps/api/src/modules/auth/`)

- [ ] 4.1 Implement `POST /api/auth/register` supporting both independent-vet and clinic registration in one endpoint (`organizationType` in the request body determines which), creating `Organization` + `OWNER` `User` in a single Prisma transaction, per `specs/user-authentication/spec.md`; verify with a test for each organization type.
- [ ] 4.2 Reject registration with a duplicate email using an explicit `findUnique` check on `User.email` before creating (matching the existing explicit-check pattern used in `tutors.controller.ts`, per design.md Context), returning `409` with `{ ok: false, message, field: "email" }`; verify with a test.
- [ ] 4.3 Implement `POST /api/auth/login` verifying credentials and issuing an access token and refresh token; verify with tests for correct credentials, wrong password, and unknown email, checking the wrong-password and unknown-email cases return the same generic error per spec.
- [ ] 4.4 Implement `POST /api/auth/refresh` performing rotation and reuse detection; verify with tests for a valid refresh, a reused (already-rotated) refresh token, and an expired refresh token.
- [ ] 4.5 Implement `POST /api/auth/logout` revoking the caller's current refresh token; verify with a test that the revoked token can no longer be used to refresh.
- [ ] 4.6 Mount the auth router at `/api/auth` in `src/routes/index.ts`, unauthenticated (these endpoints run before a session exists); verify `GET /api/health` and the new routes both respond as expected.
- [ ] 4.7 Implement `POST /api/auth/password-reset/request`: looks up the user by email, and only if found creates a `PasswordResetToken` and calls `EmailSender`, but always returns the same generic acknowledgment per `specs/user-authentication/spec.md`; verify with tests for a registered and an unregistered email asserting identical response shape and status code.
- [ ] 4.8 Implement `POST /api/auth/password-reset/confirm`: validates the token, sets the new password hash, marks the token used, and revokes every `RefreshToken` for that user per design.md Decision 7; verify with tests for the valid, expired and already-used cases, and a test that a refresh token issued before the reset can no longer be used afterward.
- [ ] 4.9 Implement `POST /api/auth/logout-all` (behind `requireAuth`): revokes every non-revoked `RefreshToken` belonging to `req.auth.userId`, per design.md Decision 8 and `specs/user-authentication/spec.md`; verify with a test that refresh tokens issued to two different simulated devices for the same user are both rejected afterward, while a still-valid access token from either device keeps working only until its own natural expiry.

## 5. User invitations (`apps/api/src/modules/users/`)

- [ ] 5.1 Implement `POST /api/users/invite` (behind `requireAuth` + `requireRole("OWNER")`): creates a pending `User` plus a `UserInvitation` row with a hashed single-use token, and calls `EmailSender.sendActivationEmail`; verify with a test that a non-`OWNER` is rejected and an `OWNER` succeeds.
- [ ] 5.2 Reject invitations for an email already belonging to a `User`, per `specs/user-invitations/spec.md`; verify with a test.
- [ ] 5.3 Implement `POST /api/auth/activate` verifying the token against `UserInvitation`, rejecting unknown/expired/already-used tokens, and setting the user's password on success; verify with tests for the valid, expired and already-used cases.
- [ ] 5.4 Verify the activated user's `organizationId` and `role` match what the inviting `OWNER` specified and cannot be altered by the activation request body; add a test asserting a client-supplied `organizationId` in the activation request is ignored.

## 6. Tenant isolation — Tutors (`apps/api/src/modules/tutors/`)

- [ ] 6.1 Add `requireAuth` to `tutors.routes.ts` for every route.
- [ ] 6.2 Update `createTutor`: set `organizationId` from `req.auth.organizationId` (never from the request body); update the existing `rut`/`email` duplicate `findUnique` checks to also filter by `organizationId`, per design.md Decision 4 and `specs/tenant-data-isolation/spec.md`; verify with a test that the same RUT succeeds across two organizations and fails within the same one.
- [ ] 6.3 Update `updateTutor`: change the `existingTutor` lookup from `findUnique({ where: { id } })` to `findFirst({ where: { id, organizationId: req.auth.organizationId } })`, returning 404 when it belongs to another organization; scope the RUT/email conflict checks by `organizationId` as well; verify with a test that updating another organization's tutor returns 404 and does not modify the record.
- [ ] 6.4 Update `getTutors`: add `where: { organizationId: req.auth.organizationId }`; verify with a test that a second organization's tutors never appear.
- [ ] 6.5 Update `searchTutors`: add the `organizationId` filter alongside the existing `OR` search conditions; verify with a test that a name/RUT match belonging to another organization is excluded from results.
- [ ] 6.6 Update `getTutorById`: change to `findFirst({ where: { id, organizationId } })`; verify with a test that requesting another organization's tutor id returns 404.

## 7. Tenant isolation — Patients (`apps/api/src/modules/patients/`)

- [ ] 7.1 Add `requireAuth` to `patients.routes.ts` for every route.
- [ ] 7.2 Update `createPatient`: set `organizationId` from `req.auth.organizationId`; change the `tutorExists` check to `findFirst({ where: { id: data.tutorId, organizationId } })` so a patient cannot be attached to another organization's tutor, per `specs/tenant-data-isolation/spec.md`'s related-record-ownership requirement; verify with a test that referencing another organization's `tutorId` returns 404 and creates nothing (species/breed existence checks stay unscoped, since those catalogs remain global).
- [ ] 7.3 Update `updatePatient`: change `existingPatient` lookup to `findFirst({ where: { id, organizationId } })`; re-validate `tutorId` ownership the same way as 7.2; verify with a test that updating another organization's patient, or reassigning it to another organization's tutor, returns 404 and changes nothing.
- [ ] 7.4 Update `getPatients`: add the `organizationId` filter; verify with a test.
- [ ] 7.5 Update `searchPatients`: add the `organizationId` filter alongside the existing name search; verify with a test.
- [ ] 7.6 Update `getPatientById`: change to `findFirst({ where: { id, organizationId } })`; verify with a test that another organization's patient id (including its nested consultations) returns 404.

## 8. Tenant isolation — Consultations and attachments (`apps/api/src/modules/consultations/`)

- [ ] 8.1 Add `requireAuth` to `consultations.routes.ts` for every route.
- [ ] 8.2 Update `createConsultation`: set `organizationId` on the created `Consultation` from `req.auth.organizationId`; change the `patientExists` check to `findFirst({ where: { id: data.patientId, organizationId } })`; verify with a test that referencing another organization's `patientId` returns 404 and creates nothing.
- [ ] 8.3 Update `getConsultations`: add the `organizationId` filter; verify with a test.
- [ ] 8.4 Update `getConsultationById`: change to `findFirst({ where: { id, organizationId } })`; verify with a test.
- [ ] 8.5 Update `getConsultationsByPatient`: change the `where` to also require `patient: { organizationId }` (or an equivalent explicit patient-ownership check before querying), so a `patientId` from another organization returns an empty/404 result instead of that patient's real history; verify with a test.
- [ ] 8.6 Update `updateConsultation`: change the `existing` lookup to `findFirst({ where: { id, organizationId } })`; verify with a test that updating another organization's consultation (including its nested `homeTreatment`/`consultationDetail`) returns 404 and changes nothing.
- [ ] 8.7 Update `deleteConsultation`: change the `existing` lookup to `findFirst({ where: { id, organizationId } })` before deleting the record and its attachment files; verify with a test that deleting another organization's consultation returns 404 and neither the record nor its files are removed.
- [ ] 8.8 Update `uploadConsultationAttachment`: change the `consultation` lookup to `findFirst({ where: { id: consultationId, organizationId } })`; verify with a test that uploading to another organization's consultation id returns 404 and stores no file.
- [ ] 8.9 Update `deleteAttachment`: change the lookup to join through `consultation` and verify `consultation.organizationId` matches the caller's, per `specs/tenant-data-isolation/spec.md`; verify with a test that deleting another organization's attachment returns 404 and the file is not removed from disk.

## 9. Prisma extension coverage check

- [ ] 9.1 Write an integration test that, using two seeded organizations with one tutor/patient/consultation each, exercises every endpoint touched in sections 6-8 as a user from organization A and asserts organization B's data is never returned, modified, or deleted — this is the direct executable form of `specs/tenant-data-isolation/spec.md`'s scenarios.

## 10. Mobile auth

- [ ] 10.1 Create `apps/mobile/src/features/auth/` (`api/`, `hooks/`, `components/`, `types/`, `index.ts`) with a login screen collecting email and password, in Spanish per the UI language rule; verify by running the screen in Expo Go and completing a login against a local API.
- [ ] 10.2 Implement token storage using `expo-secure-store` (access token and refresh token) and a session hook (`useAuth` or equivalent) exposing the current user/organization and a logout action; verify tokens persist across an app reload.
- [ ] 10.3 Add an Axios request interceptor in `apps/mobile/src/services/api.ts` that attaches `Authorization: Bearer <accessToken>`; verify with a manual request that the header is present.
- [ ] 10.4 Add an Axios response interceptor that, on a 401, attempts one silent refresh via `POST /api/auth/refresh` and retries the original request, logging the user out if the refresh also fails; verify by forcing an expired access token and confirming the app recovers without a visible login prompt.
- [ ] 10.5 Gate the existing app routes behind an authenticated session (redirect to the login screen when no valid session exists) in `apps/mobile/src/app/`; verify by clearing stored tokens and confirming protected screens are unreachable.
- [ ] 10.6 Add an "Invitar usuario" screen reachable only to an `OWNER` (role check from the session) that calls `POST /api/users/invite`, and an activation screen (reached via the emailed link) that calls `POST /api/auth/activate`; verify both flows manually against a local API and a real or test email inbox.
- [ ] 10.7 Add an "Olvidé mi contraseña" link on the login screen leading to a request screen (calls `POST /api/auth/password-reset/request`, shows the same generic confirmation regardless of outcome) and a reset screen reached via the emailed link (calls `POST /api/auth/password-reset/confirm`); verify both flows manually against a local API and a real or test email inbox, including that completing a reset requires logging in again on any other device/session.
- [ ] 10.8 Add a "Cerrar sesión en todos los dispositivos" action in the account/settings area, calling `POST /api/auth/logout-all` and then clearing local tokens and returning to the login screen; verify manually with two logged-in sessions (e.g., two devices or a device plus Expo web) that triggering it from one signs both out.

## 11. Documentation

- [ ] 11.1 Replace the "Duplicate Tutor validation" section of `PROJECT_STATUS.md` with a pointer to `specs/tenant-data-isolation/spec.md` once this change is archived, per the project's rule that specs supersede equivalent `PROJECT_STATUS.md` sections.
- [ ] 11.2 Update `PROJECT_STATUS.md`'s "Risks Pending" section to remove the "No authentication or user account flow" item and record the new capability state (Organizations, auth, invitations) per the project's documentation rules.
- [ ] 11.3 Update `TASKS.md` and `ROADMAP.md` to reflect that authentication, multi-tenancy and user invitations are implemented, moving the still-deferred admin-only Species/Breed maintainer to depend on the now-existing `OWNER` role.
