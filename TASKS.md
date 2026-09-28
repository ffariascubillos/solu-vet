# TASKS.md

Active work queue. A finished item is deleted, not archived — it is already in `git log`.

## IN PROGRESS

- Home/navigation fixes + Chilean species catalog (`openspec/changes/update-home-nav-and-species-catalog/`): implemented and tested; pending final commit and `/opsx:archive`.

## NEXT

### Backend

- [ ] Normalize validation error responses.
- [ ] Add an admin-only CRUD maintainer for species and breeds (create, search, update, delete), gated by the existing `requireAuth` + `requireRole("OWNER")` middlewares.

### Mobile

- [ ] Manually verify the Tutor/Patient edit screens on an Android phone via Expo Go: edit success, duplicate rut/email errors, species/breed cascade reset, validation errors.

- [ ] Before the Android + web MVP launch, mitigate the web token-storage risk recorded in `PROJECT_STATUS.md` (Risks Pending).

### Testing

- [ ] Add cleanup for the users/organizations the Playwright e2e (`npx playwright test -c e2e`) registers in the dev database on every run (`e2e-drawer-<uuid>@example.com`). No API endpoint deletes them today.

## Rules

1. Delete a finished item. `git log` is the history; do not keep a DONE list here.
2. Update `PROJECT_STATUS.md` only when a capability or a technical decision actually changed.
3. If the work went through OpenSpec, its rationale belongs in the change's `design.md`, not in `PROJECT_STATUS.md`.
4. Keep this file short and actionable.
