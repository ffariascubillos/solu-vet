# TASKS.md

Active work queue. A finished item is deleted, not archived — it is already in `git log`.

## IN PROGRESS

- None.

## NEXT

### Changes

- [ ] Account self-service: change password while logged in (reusing `User.sessionVersion` to close the other sessions) and edit the user's name, evaluating asking for it on activation (ítems 1 y 6 de `checklist-tarea-add-auth-multitenancy.md`).
- [ ] Record authorship for Tutor, Patient and Consultation: nullable `createdByUserId` plus `createdByName` and `createdByEmail` (see Decision 7 in the `design.md` of the OpenSpec change `add-user-roles-and-seat-limits`).

### Backend

- [ ] Normalize validation error responses.
- [ ] Add an admin-only CRUD maintainer for species and breeds (create, search, update, delete), gated by the existing `requireAuth` + `requireRole("OWNER")` middlewares.

### Mobile

- [ ] Manually verify the Tutor/Patient edit screens on an Android phone via Expo Go: edit success, duplicate rut/email errors, species/breed cascade reset, validation errors.

- [ ] Before the Android + web MVP launch, mitigate the web token-storage risk recorded in `PROJECT_STATUS.md` (Risks Pending).

### Testing

- [ ] Add cleanup for the users/organizations the Playwright e2e (`npx playwright test -c e2e`) registers in the dev database on every run (`e2e-drawer-<uuid>@example.com`, and the clinic owner plus pending invitation from `invite-user.spec.ts`). No API endpoint deletes them today.

## Rules

1. Delete a finished item. `git log` is the history; do not keep a DONE list here.
2. Update `PROJECT_STATUS.md` only when a capability or a technical decision actually changed.
3. If the work went through OpenSpec, its rationale belongs in the change's `design.md`, not in `PROJECT_STATUS.md`.
4. Keep this file short and actionable.
