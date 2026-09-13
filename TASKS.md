# TASKS.md

Active work queue. A finished item is deleted, not archived — it is already in `git log`.

## IN PROGRESS

- Authentication + multi-tenancy (`openspec/changes/add-auth-multitenancy/`): planning complete and validated (proposal, 4 capability specs, design, tasks). Mobile Login/Register screens mocked up (`apps/mobile/src/features/auth/`, `apps/mobile/app/(auth)/`), no backend wiring yet. Next: backend implementation per `tasks.md` sections 1-9, phase by phase.

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
