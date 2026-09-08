# TASKS.md

Active work queue. A finished item is deleted, not archived — it is already in `git log`.

## IN PROGRESS

- None.

## NEXT

### Backend

Basic authentication is the priority: it does not exist yet, and it blocks the admin-only Species/Breed maintainer.

- [ ] Add basic authentication. No auth flow exists today; anyone with the API URL has full access to Tutor and Patient data.
- [ ] Normalize validation error responses.
- [ ] Add an admin-only CRUD maintainer for species and breeds (create, search, update, delete). Depends on authentication with roles, since there is no way to restrict anything to administrators yet.

### Mobile

- [ ] Manually verify the Tutor/Patient edit screens on an Android phone via Expo Go: edit success, duplicate rut/email errors, species/breed cascade reset, validation errors.

### Testing

- None.

## Rules

1. Delete a finished item. `git log` is the history; do not keep a DONE list here.
2. Update `PROJECT_STATUS.md` only when a capability or a technical decision actually changed.
3. If the work went through OpenSpec, its rationale belongs in the change's `design.md`, not in `PROJECT_STATUS.md`.
4. Keep this file short and actionable.
