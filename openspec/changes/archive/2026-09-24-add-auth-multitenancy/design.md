## Context

See `proposal.md` for motivation and `specs/{organizations,user-authentication,user-invitations,tenant-data-isolation}/spec.md` for the required behavior. This document covers how those requirements get built on top of the current codebase.

Relevant current state, confirmed by reading the code (not assumed):
- `apps/api/prisma/schema.prisma` has a `User` model with `email`, `passwordHash`, `name` — it is not referenced by any controller, route, or middleware anywhere in `apps/api/src`. Rewriting it has no consumer to migrate.
- No auth-related dependency is installed (`jsonwebtoken`, `bcrypt`/`bcryptjs`, `passport`, any email SDK) and `app.ts` has no auth middleware in its chain (`cors` -> `json` -> static uploads -> router -> `errorHandler`).
- Every read, list, search, update and delete in `tutors.controller.ts`, `patients.controller.ts` and `consultations.controller.ts` queries Prisma with no scoping filter at all — confirmed by reading all three files. The full list of call sites that need a scope change is in `tasks.md`.
- `Tutor.rut` and `Tutor.email` are global `@unique` columns today; `tutors.controller.ts` deliberately uses explicit `findUnique` duplicate checks instead of relying on Prisma's `P2002` metadata, because that metadata does not reliably identify the colliding field in this runtime (documented in `PROJECT_STATUS.md`). The per-organization uniqueness change must preserve that explicit-check pattern, only adding `organizationId` to each lookup.
- Prisma generator uses `provider = "prisma-client"` with a custom `output` (`../src/generated/prisma`) — the client extension approach below works the same way regardless of output path.
- Mobile has no `features/auth/` directory, no token storage, and `services/api.ts` is a bare Axios instance with no interceptor — this is greenfield on the mobile side, not a retrofit.

## Goals / Non-Goals

**Goals:**
- Make cross-tenant data access structurally hard to get wrong, not just a checklist every new endpoint has to remember.
- Ship an authentication flow appropriate for a mobile app used across a full working day, without server-side session storage for access tokens.
- Leave `Organization` shaped so trial/plan/subscription logic can be added later purely as new reads/writes against fields that already exist, with no schema migration required to introduce the concept.

**Non-Goals:**
- No payment processing, plan enforcement, or trial-expiry lockout in this change (per `organizations` spec).
- No fine-grained permission system beyond the single `OWNER` role gate needed for inviting users (per the earlier decision to keep only `OWNER` for now).
- No email-sending infrastructure decision beyond naming a concrete default; swapping providers later should not require a design change (see Decisions below).
- No rate-limiting or CAPTCHA on the password-reset-request endpoint in this change — see Risks below.

## Decisions

### 1. Token strategy: short-lived JWT access token + rotating opaque refresh token

**Decision**: The access token is a stateless JWT (`{ sub: userId, organizationId, role, iat, exp }`, HMAC-signed with a server secret). The refresh token is a random opaque string (not a JWT), stored server-side as a salted hash in a new `RefreshToken` table, and rotated on every use.

**Why**: A pure stateless JWT (access-token-only) cannot be revoked before it expires — logging out, deactivating an invited user, or reacting to a stolen device would do nothing until the token's natural expiry. A refresh token backed by a DB row is revocable: logout deletes/marks the row, and reusing an already-rotated refresh token is detectable (see below), which a bare JWT can never provide. Keeping the *access* token stateless (no DB lookup per request) preserves the performance and simplicity that makes JWTs attractive for the vast majority of requests; only the infrequent refresh call touches the database.

**Rotation and reuse detection**: each `POST /api/auth/refresh` call issues a new refresh token and immediately invalidates the one just used (`revokedAt` set, `replacedByTokenId` pointing at the new row). If a refresh token is presented again after being replaced, that is a signal of token theft or a race (e.g., an old token got cached client-side and replayed) — the system revokes every token in that session's lineage, forcing a fresh login. This is the standard rotation-with-reuse-detection pattern and needs no extra library, only the `RefreshToken` table and the check in the refresh handler.

**Alternatives considered**:
- *Server-side session (cookie + session store)*: natural for a browser app, awkward for a React Native mobile client where cookie jars are not the primary storage idiom and the product's near-term target is Android first. Rejected for the primary client, though nothing here blocks adding cookie-based sessions for the future desktop/web target later if needed — the API surface (`login`, `refresh`, `logout`) does not change shape.
- *Stateless JWT for both access and refresh (no DB row)*: simplest to build, but non-revocable — logout would be purely client-side ("forget the token locally"), so a stolen refresh token would remain valid until it expired no matter what the user does. Rejected because decision 8 (organizationId isolation, and security generally) was explicitly prioritized by the user over minimizing build effort.

### 2. Token lifetimes: 15-minute access token, 30-day rotating refresh token

**Decision**: Access token expires in 15 minutes. Refresh token expires in 30 days from issuance, but is re-issued (sliding) on every successful refresh, so a user who opens the app at least once every 30 days is never forced to log in again; one who does not stays logged out after 30 days of inactivity and must log in again.

**Why**: 15 minutes is long enough that the mobile app is not constantly refreshing mid-task, short enough that a captured access token has a small blast radius. The refresh happens silently in the Axios interceptor (mobile) — the user never sees it. 30 days matches "used through a normal workday, doesn't demand daily login" while still bounding how long a lost or stolen device's session stays valid if never revoked manually; it is a sliding window, not a fixed calendar expiry, so active users effectively never see the login screen again once signed in, which matches "similar to other mobile apps" from the requirement. No absolute hard cap beyond the 30-day sliding window is added in this change — revisit if a future security review asks for one; noted under Risks below.

**Alternatives considered**: a much shorter refresh window (e.g., 7 days) forces more frequent logins than the user asked for ("no debería tener que iniciar sesión nuevamente todos los días"); a much longer or non-expiring refresh token (e.g., 1 year, or none) weakens the "not indefinitely" requirement with no corresponding benefit, since rotation already keeps active users perpetually signed in.

### 3. Password hashing: bcrypt-family hash, not a from-scratch scheme

**Decision**: Hash passwords with `bcryptjs` (pure JavaScript implementation) rather than native `bcrypt` or `argon2` bindings.

**Why**: `bcryptjs` needs no native compilation step, which matters on a Windows development machine without a guaranteed C++ build toolchain (this repo's primary dev environment, per the session's `PowerShell`/Windows context) and avoids a class of "works on my machine" install failures in CI or on a fresh clone. `bcrypt`'s hashing strength is adequate for an MVP of this size; moving to `argon2` later, if ever needed, only touches the hashing call inside the registration/activation/password-set code paths, not the schema or the API contract.

### 4. Cross-tenant isolation: layered — explicit per-controller scoping plus a Prisma client extension, not database-level RLS yet

Verified against current Prisma documentation (Prisma's official `$extends` `query` component docs and its row-level-security blog example) before deciding this, since it is the most security-critical piece of the whole change:

**Decision**: Two layers, both required:

1. **Explicit scoping in every controller** (primary, non-negotiable layer): every Prisma call touching Tutor, Patient, or Consultation includes `organizationId: req.auth.organizationId` in its `where`, sourced only from the verified access token (`requireAuth` middleware sets `req.auth`), never from `req.body`/`req.query`/`req.params`. Lookups that currently use `findUnique({ where: { id } })` for a mutate-or-delete-by-id operation move to `findFirst({ where: { id, organizationId } })` — `findFirst` accepts arbitrary compound filters in every Prisma version, so this avoids relying on version-specific "extended where-unique input" behavior for a security-critical path. A not-found result (whether the id truly doesn't exist, or exists in another organization) always responds `404`, matching the `tenant-data-isolation` spec's requirement not to let a caller distinguish the two cases.
2. **Prisma client extension as defense-in-depth** (secondary, structural layer): a `forOrganization(organizationId)` extension — the same pattern shown in Prisma's own client-extensions documentation for building a scoped client per caller — auto-injects `where.organizationId` into `findMany`/`findFirst`/`updateMany`/`deleteMany` for the `Tutor`, `Patient`, and `Consultation` models. `requireAuth` builds this scoped client once per request (`req.prisma = prisma.$extends(forOrganization(req.auth.organizationId))`) and controllers use `req.prisma` for tenant-scoped models instead of importing the bare singleton. If a future controller forgets the manual filter, the request is still confined to the caller's organization because the client instance itself cannot see other organizations' rows for those operations.

Nested `include`s (e.g., a Tutor's `patients`, a Patient's `consultations` and their `homeTreatment`/`followUps`/`vaccineRecords`/`attachments`) are **not** separately filtered by the extension — Prisma's own documentation states `include`/`select` cannot be mutated inside a query extension. This is safe by construction, not by the extension: a Patient can only ever be created under a Tutor in the same organization (enforced by the related-record-ownership check in Decision 4's controller layer), so a Tutor correctly scoped at the top level cannot have a nested Patient from a different organization to leak. The same chain of custody applies through Consultation and its children. This reasoning is the basis for the `tenant-data-isolation` spec's "related-record writes validate organization ownership" requirement — it is not just data hygiene, it is what keeps nested reads safe without needing to filter every nested level individually.

**Why not database-level Row-Level Security (RLS) now**: Prisma's documented RLS pattern (`set_config` inside a transaction wrapping every query, paired with Postgres RLS policies) would enforce isolation even against a raw SQL query or a completely new endpoint that forgets scoping entirely — a real security upside. It is deliberately deferred: it requires writing and maintaining a Postgres policy per tenant-scoped table, wiring session-variable propagation through `@prisma/adapter-pg`'s connection pool correctly (session variables are connection-scoped, so pooling needs care), and is more infrastructure than an MVP-stage team should carry before the app has real multi-tenant traffic to protect. The two-layer approach above already satisfies the spec's "never trust client-supplied organizationId, never leak cross-tenant data" requirements through the application layer. RLS is recorded here as the natural next hardening step (see Open Questions) rather than dropped.

**Alternatives considered**: relying on the client extension alone (no manual per-controller filter) was rejected because `findUnique`/`findFirst`-by-id calls used for existence checks *before* a write (e.g., "does this tutorId belong to me") still need an explicit, readable check in the controller for the 404-vs-leak semantics the spec demands — an invisible client-level filter that silently returns `null` is easy to reason about for reads, but the ownership-validation-before-nested-write logic is clearer written out explicitly at the call site.

### 5. Invitation delivery: emailed activation link via a swappable email-sending interface, default provider Resend

**Decision**: Define a small `EmailSender` interface (e.g., `sendActivationEmail(to, activationUrl)`) with one concrete MVP implementation. Recommend **Resend** as that first implementation: a modern transactional email API with a straightforward Node/TypeScript SDK and a free tier sufficient for MVP-stage invitation volume.

**Why an interface, not a direct SDK call**: the user has no established email provider in this project yet, and the concrete choice is not architecturally significant as long as sending is isolated behind one seam — swapping Resend for another provider later (or for a transactional-email service the user's hosting choice already bundles) is then a one-file change, not a controller rewrite. This directly serves "no quiero implementar pagos... pero sí quiero que la arquitectura permita incorporar planes sin rediseñar" applied to the adjacent concern of not locking into a vendor prematurely.

**Assumption flagged for review**: Resend is a reasonable default, not a hard requirement — confirm before `tasks.md` is executed, since it requires creating an external account and an API key that only the user can provision.

### 6. Organization SaaS-readiness fields live on `Organization` now; `Subscription`/billing entities do not exist yet

**Decision**: Add only `trialEndsAt` (`DateTime`, set to `createdAt + 21 days`) and `subscriptionStatus` (`TRIALING | ACTIVE | PAST_DUE | CANCELED`, default `TRIALING`) to `Organization` in this change. Do not create a `Plan`, `Subscription`, or payment-provider-linked model yet.

**Why**: These two fields are the only pieces of trial/subscription state that must exist from the moment an `Organization` is created — the trial clock has to start at signup, or a later billing change would have no historical `trialEndsAt` to backfill accurately. Plan pricing (the $9.990 / $19.990 CLP figures), seat limits per plan, and payment-provider integration depend on a payment processor decision the user has explicitly deferred, and adding those tables now would be speculative modeling of a contract that doesn't exist yet. When that decision is made, a `Subscription` model referencing `Organization` by id is a straightforward additive change — it does not require touching `organizationId` scoping, auth, or any of this change's structure.

### 7. Password recovery: emailed reset link via the same token pattern as invitations, plus session revocation on success

**Decision**: Add a `PasswordResetToken` model (`id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt`) — structurally identical to `UserInvitation`'s token handling but without organization/role fields, since a reset targets an already-existing user rather than creating one. `POST /api/auth/password-reset/request` looks up the `User` by email, and — only if found — creates a token row and calls the same `EmailSender` interface from Decision 5 with a reset link; the response is identical whether or not the email matched, so the endpoint cannot be used to enumerate registered emails. `POST /api/auth/password-reset/confirm` validates the token (unknown/expired/used all rejected, mirroring `UserInvitation` activation), sets the new password hash, marks the token used, and revokes every `RefreshToken` belonging to that user.

**Why session revocation on reset**: if a password is being reset, it's often because the previous one may be compromised or the account holder no longer trusts the current session (a shared or lost device, for instance). Leaving old refresh tokens valid after a reset would defeat the point of changing the password. This reuses the revocation mechanism already built for logout (Decision 1) — a bulk "revoke all tokens for this userId" instead of a single token, no new mechanism required.

**Why a separate model instead of reusing `UserInvitation`**: `UserInvitation` carries `organizationId`, `role`, and `invitedByUserId` — fields meaningful only when a new user is being created. Reusing that table for password resets would leave those columns meaningless for every reset row (nullable fields with no clear purpose, and a table name that no longer matches half its rows). A second small table with the same shape as `RefreshToken`'s hash-at-rest pattern is simpler to reason about than overloading one table for two different lifecycles.

**Alternatives considered**: sending a temporary password by email, like the invitation flow's initial (rejected) idea — rejected for the same reason: a plaintext credential in an inbox is a standing risk (forwarded emails, shared inboxes, email account compromise) that a self-chosen-password-via-token link avoids entirely; the user was explicit that passwords should never travel by email in either flow.

### 8. "Log out of all devices": a user-triggered bulk revocation, not an absolute session cap

**Decision**: Add `POST /api/auth/logout-all`, authenticated, which revokes every non-revoked `RefreshToken` belonging to `req.auth.userId` — every device, every rotation chain, in one call. This is the same bulk-revoke mechanism Decision 7 already uses when a password reset succeeds, exposed here as its own action the user can trigger without changing their password.

**Why**: the user raised a concrete scenario a 30-day sliding refresh token doesn't address on its own: a lost or stolen phone, or a coworker in a clinic accessing an unattended device. The direct fix is giving the account holder an immediate way to cut off every other session from any device they still control, the moment they notice — not waiting on a fixed calendar expiry.

**Alternatives considered**: an absolute session cap (e.g., force re-login every 60 or 90 days regardless of activity) was discussed and explicitly rejected. Setting the cap equal to the sliding window's own duration (30 days) would force every user to re-enter their password monthly regardless of activity, defeating the sliding window's purpose (per the Risk this replaces, below); setting it any longer than the sliding window adds real complexity — a `firstIssuedAt` field carried across every rotation in a chain, plus a check in the refresh handler — for a scenario `logout-all` already resolves the moment the user notices something is wrong. The user chose the self-service action over the fixed cap.

## Risks / Trade-offs

- **[Risk]** Every existing Tutor/Patient/Consultation controller function changes in this one release — a large, security-sensitive surface to modify at once. **Mitigation**: `tasks.md` breaks this into one task per file with the exact function list already audited (see the file-by-file list derived while writing this design), and the `tenant-data-isolation` spec's scenarios are concrete enough to serve directly as test cases before this change is archived.
- **[Risk]** `Tutor.rut`/`Tutor.email` moving from global to per-organization uniqueness is a real schema/behavior change on a table that likely already has rows in development/testing databases. **Mitigation**: the migration plan below adds `organizationId` as nullable-then-backfilled-then-required in sequence, and the composite unique index is only added after backfill succeeds.
- **[Risk]** 30-day sliding refresh tokens with no absolute cap mean a session can theoretically persist forever if the app (or a lost/stolen device still running it) is opened often enough. **Mitigation**: Decision 8's `POST /api/auth/logout-all` gives the account holder a way to cut off every other session immediately upon noticing a lost device or unauthorized access, without waiting on a calendar expiry. An absolute cap was considered and rejected — see Decision 8 — since it would either force everyone to re-login monthly (if set equal to the sliding window) or add real implementation complexity for a scenario the bulk-revoke action already resolves.
- **[Risk]** The Prisma client extension does not cover nested `include`s (a documented Prisma limitation, not a bug to fix). **Mitigation**: covered by construction via the related-record-ownership checks (Decision 4) — a nested include can only ever surface same-organization data if writes are correctly validated, which is exactly what the `tenant-data-isolation` spec's "related-record writes validate organization ownership" requirement enforces and tests.
- **[Trade-off]** Choosing a named email provider (Resend) in the design, while the interface is swappable, still means a concrete account has to be created before `tasks.md`'s invitation tasks can be fully exercised end-to-end. Acceptable since the interface seam means this choice is cheap to revisit.
- **[Risk]** `POST /api/auth/password-reset/request` has no rate-limiting or CAPTCHA in this change, so it could be called repeatedly against the same or many emails (a nuisance — repeated reset emails to a real user — rather than a data-exposure risk, since the response never reveals whether the email exists). **Mitigation**: acceptable for MVP traffic levels; add per-email or per-IP rate-limiting as a follow-up if abuse is observed (see Open Questions).

## Migration Plan

1. Add `Organization` model and the rewritten `User` model in one migration; since `User` has no live consumers, this is a clean rewrite rather than a data migration.
2. Add `organizationId` to `Tutor`, `Patient`, `Consultation` as **nullable** in a first migration step, so existing development-database rows are not immediately invalidated.
3. Backfill: since there is no production data yet (MVP, pre-launch), backfill is expected to mean seeding one development `Organization` and pointing existing dev rows at it, or truncating dev/test tables — a decision for whoever runs the migration locally, not a production data-migration concern. `tasks.md` calls this out explicitly so it isn't silently skipped.
4. Make `organizationId` **required** and add `@@index([organizationId])` on `Tutor`, `Patient`, `Consultation` in a follow-up migration step once backfilled.
5. Replace `Tutor`'s global `@unique` on `rut`/`email` with `@@unique([rut, organizationId])` / `@@unique([email, organizationId])` in the same step as (4), since both changes touch the same rows.
6. Ship the `requireAuth` middleware and the Prisma extension before flipping any controller over, so each controller migration task is a mechanical "add the filter" change against an already-working auth layer, not a simultaneous two-part change.
7. Add `RefreshToken`, `UserInvitation` and `PasswordResetToken` in the same migration pass as step 1, since none of them depend on the `organizationId` backfill in steps 2-5 — they only reference `User`, which already exists cleanly.
8. Rollback: since this ships pre-launch with no real tenant data at stake, rollback is a straightforward `prisma migrate` revert; no blue-green or dual-write strategy is needed at this stage.

## Open Questions

- Whether Postgres-level Row-Level Security (Decision 4's deferred option) should be scheduled as a follow-up hardening change once the app has real multi-tenant traffic — does not change this change's specs, approach, or tasks.
- Final email provider choice (Resend proposed) — confirm before executing the invitation-related and password-reset-related tasks; swapping it later only touches the `EmailSender` implementation, not the spec or the surrounding controller code.
- Whether to add rate-limiting to `POST /api/auth/password-reset/request` — can be added later as pure middleware in front of the existing route without changing its contract or the spec.
