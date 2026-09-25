# TASKS.md

Active work queue. A finished item is deleted, not archived — it is already in `git log`.

## IN PROGRESS

- Authentication + multi-tenancy (`openspec/changes/add-auth-multitenancy/`): sections 1-10 done (schema, auth infra, auth endpoints, invitations, tenant isolation on Tutors/Patients/Consultations, Prisma extension coverage, mobile auth). Section 11 (Documentation) in progress. Not yet archived — see `openspec/changes/add-auth-multitenancy/tasks.md` for the full per-section detail.

## NEXT

### Backend

- [ ] Normalize validation error responses.
- [ ] Add an admin-only CRUD maintainer for species and breeds (create, search, update, delete), gated by the existing `requireAuth` + `requireRole("OWNER")` middlewares.

### Mobile

- [ ] Manually verify the Tutor/Patient edit screens on an Android phone via Expo Go: edit success, duplicate rut/email errors, species/breed cascade reset, validation errors.

- [ ] Before the Android + web MVP launch, mitigate the web token-storage risk recorded in `PROJECT_STATUS.md` (Risks Pending).

### Testing

- None.

## Rules

1. Delete a finished item. `git log` is the history; do not keep a DONE list here.
2. Update `PROJECT_STATUS.md` only when a capability or a technical decision actually changed.
3. If the work went through OpenSpec, its rationale belongs in the change's `design.md`, not in `PROJECT_STATUS.md`.
4. Keep this file short and actionable.
