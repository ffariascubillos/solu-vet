## Why

soluVet has no authentication today: anyone with the API URL has full read, write and delete access to every Tutor, Patient and Consultation record, with no separation between different veterinarians or clinics. This blocks any real usage beyond a single-team demo, blocks the already-planned admin-only Species/Breed maintainer (documented in `PROJECT_STATUS.md` as depending on "authentication with roles"), and — per an audit of every existing controller performed for this proposal — every list, search, detail, update and delete endpoint on Tutor, Patient and Consultation currently has no scoping at all, which would remain a live cross-tenant vulnerability even after adding login unless the isolation is designed and enforced deliberately. This change defines `Organization` as the tenant boundary, adds real authentication, and closes those cross-tenant gaps, while shaping the schema so a future trial/paid-plan model can be added later without redesigning `Organization`.

## What Changes

- Add an `Organization` model (`type`: `INDEPENDENT` | `CLINIC`) as the tenant isolation boundary. Every `User` belongs to exactly one `Organization`.
- Add `Organization.trialEndsAt` and `Organization.subscriptionStatus` (`TRIALING` | `ACTIVE` | `PAST_DUE` | `CANCELED`, default `TRIALING`) so a future trial/plan/subscription model can be layered on without changing the `Organization` shape. No payment processing, plan enforcement or billing integration is implemented in this change.
- Rewrite the existing `User` model (currently unused by any route or controller — safe to reshape): add `role` (`OWNER` only for this change, extensible enum) and `organizationId`.
- Add authentication endpoints: `POST /api/auth/register` (creates `Organization` + `OWNER` `User` together), `POST /api/auth/login` (issues a short-lived JWT access token + a rotating refresh token), `POST /api/auth/refresh`, `POST /api/auth/logout`.
- Add a `requireAuth` middleware that verifies the access token and attaches `req.auth = { userId, organizationId, role }` to the request; every Tutor/Patient/Consultation route requires it.
- Add `organizationId` to `Tutor`, `Patient` and `Consultation`. **BREAKING**: change `Tutor.rut` and `Tutor.email` uniqueness from global (`@unique`) to per-organization (`@@unique([rut, organizationId])`, `@@unique([email, organizationId])`) — the same RUT or email may now exist in two different organizations.
- Update every existing Tutor, Patient and Consultation controller function (create, list, search, detail, update, delete, nested writes, attachment upload/delete) to scope every query by the authenticated user's `organizationId` from `req.auth`, never from client-supplied input.
- Add a Prisma client extension that auto-injects the organization filter for tenant-scoped models as defense-in-depth alongside the explicit per-controller checks.
- Add an OWNER-only invitation flow: `POST /api/users/invite` creates a pending `User` and emails an activation link with a single-use, expiring token; `POST /api/auth/activate` lets the invited person set their own password. No plaintext password is ever emailed.
- Add a password recovery flow: `POST /api/auth/password-reset/request` emails a single-use, expiring reset link to a registered email without revealing whether that email exists; `POST /api/auth/password-reset/confirm` lets the person set a new password with a valid token. No plaintext password is ever emailed, mirroring the invitation activation flow.
- Mobile: add a `features/auth/` module (login screen, "olvidé mi contraseña" flow, secure token storage, Axios interceptor that attaches the access token and refreshes it on expiry) and gate the existing screens behind an authenticated session.
- `Species`, `Breed` and `Region` remain global, unaffected by tenant scoping (confirmed as an explicit decision, not an oversight).

## Capabilities

### New Capabilities
- `organizations`: `Organization` as the tenant unit — type, trial/subscription-readiness fields, and how a `User` is bound to exactly one `Organization`.
- `user-authentication`: registration (independent vet and clinic owner), login, access/refresh token issuance and rotation, logout, and self-service password recovery via an emailed reset link.
- `user-invitations`: an OWNER inviting additional users into their `Organization` and the invited user activating their account with a self-chosen password.
- `tenant-data-isolation`: the rule that a user from `Organization` A can never read, modify or delete data belonging to `Organization` B, applied to Tutor, Patient, Consultation and their related records, including per-organization uniqueness of Tutor identifiers.

### Modified Capabilities
- None. Tutor RUT/email uniqueness was previously documented only in `PROJECT_STATUS.md` (not an OpenSpec capability), so its per-organization redefinition is captured as part of the new `tenant-data-isolation` spec rather than as a delta to an existing one.

## Impact

- **Schema**: `apps/api/prisma/schema.prisma` — new `Organization` model, rewritten `User` model, `organizationId` added to `Tutor`/`Patient`/`Consultation`, new unique constraints on `Tutor`, new `RefreshToken`, `UserInvitation` and `PasswordResetToken` models. Requires a new migration.
- **Backend modules**: every function in `apps/api/src/modules/{tutors,patients,consultations}/*.controller.ts`; new `apps/api/src/modules/{auth,users}/` modules; new `requireAuth`/`requireRole` middlewares in `apps/api/src/middlewares/`; new Prisma client extension near `apps/api/src/lib/prisma.ts`.
- **Dependencies**: adds a JWT library, a password-hashing library and an email-sending library to `apps/api`.
- **Mobile**: new `apps/mobile/src/features/auth/`; an interceptor added to `apps/mobile/src/services/api.ts`; navigation gating in `apps/mobile/src/app/`.
- **Documentation**: the "Duplicate Tutor validation" section of `PROJECT_STATUS.md` becomes superseded by the `tenant-data-isolation` spec once this change is archived, per the project's rule that specs replace equivalent `PROJECT_STATUS.md` sections.
