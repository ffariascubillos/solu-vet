# TASKS.md

Active work queue. A finished item is deleted, not archived — it is already in `git log`.

## IN PROGRESS

- None.

## NEXT

### Changes

- [ ] **1 — Account self-service** (own OpenSpec change, before 2). Decisions agreed with Felipin:
  - New settings screen ("Ajustes", like Netflix/Crunchyroll account settings) where the logged-in user edits their name and changes their password. Reached from a new item in the drawer (side menu), not from inside Cuenta.
  - Move "Cerrar sesión en todos los dispositivos" from Cuenta to Ajustes.
  - Change password while logged in, reusing `User.sessionVersion` to close the other sessions.
  - Ask for the name on the invitation activation screen, so invited users don't stay nameless.
  - The updated name shows in the Home greeting and the drawer header without logging out.
  - Source: ítems 1 y 6 de `checklist-tarea-add-auth-multitenancy.md`.
- [ ] **2 — Record authorship + change history** for Tutor, Patient and Consultation (own OpenSpec change, after 1). Decisions agreed with Felipin:
  - Wipe the dev test data for Tutor, Patient and Consultation instead of backfilling.
  - One append-only `AuditLog` table for the three entities (`entityType` + `entityId`), scoped by `organizationId`; no update/delete endpoints; written in the same transaction as the change.
  - One event per save (`CREATE` and `UPDATE`) with a JSON `changes` list of `{ field, oldValue, newValue }`; log every field, not only "critical" ones.
  - Each event keeps a nullable `userId` (`onDelete: SetNull`) plus a snapshot of the author's name and email, so history survives removing the member (see Decision 7 in the `design.md` of the OpenSpec change `add-user-roles-and-seat-limits`).
  - Reference fields (species, breed) also store the label at that moment, not only the id.
  - Field names stay in English in the DB and are mapped to Spanish in the UI.
  - "Creado por" and "Última edición por … el …" are derived from the log, not stored as columns on the entities.
  - Mobile: show them plus a "Historial" view in Tutor and Patient detail; Consultation gets it in its Phase 2 screens (API logs it from the start).

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
