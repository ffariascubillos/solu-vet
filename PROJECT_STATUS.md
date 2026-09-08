# PROJECT_STATUS.md

Why the system is the way it is: decisions taken, current capability state, and open risks.

**What** changed and when lives in `git log`. The rationale for any change made through OpenSpec lives in that change's `openspec/changes/archive/<id>/design.md`, not here.

Last audited: 2026-09-06.

## Technical Decisions

Decisions taken before OpenSpec was adopted, or outside of a change. A decision made inside an OpenSpec change belongs in that change's `design.md`.

### Tutor and Patient registration

- Tutor and Patient are created separately: `POST /api/tutors` first, then `POST /api/patients` with the returned `tutorId`. There is no combined endpoint and no backend transaction, and none is planned for the MVP.
- A Tutor without Patients is a valid record. Tutor registration is independent and finishes on Tutor detail; Patients are added from there, reusing the Patient registration screen with the Tutor preselected (`patients/create?tutorId=...`). This is how the orphan-Tutor risk is handled — in the mobile workflow, not with a backend constraint.
- `Patient.lastName` is inherited from the Tutor's `lastName`; there is no visible Patient last-name input. On update it is resent from the Patient's current `tutor.lastName`, so it self-corrects if the Tutor's last name changed.
- Patient edit keeps the Tutor fixed. A Patient cannot be reassigned to another Tutor from the app.

### Duplicate Tutor validation

- `Tutor.rut` and `Tutor.email` are `@unique`. RUT is normalized and format-validated (Chilean RUT) in the API before creation.
- Duplicates are detected with explicit `findUnique()` checks inside `createTutor()`/`updateTutor()` instead of relying on Prisma `P2002`: the `P2002` metadata does not reliably identify which field collided in this runtime. Update excludes the tutor's own record, so saving a tutor with its own unchanged rut/email does not produce a false `409`.
- Central `P2002` handling stays in `error-handler.ts` as a fallback for concurrent writes.
- Mobile sends an empty optional Tutor email as `undefined`, so it is omitted from the JSON body rather than sent as an empty string.

### Species and Breed as reference tables

- `Species`/`Breed` are database tables, not a Prisma enum, because a future admin-only maintainer must be able to add values without a database migration and an app release. An enum would require both for every new value; a table only needs a row insert.
- `Patient.speciesId` and `Patient.breedId` are both required. The seed catalog includes a "Mestizo / Sin raza definida" breed per species, so "I don't know the exact breed" is always a valid choice without leaving the field empty.
- No English→Spanish label mapping is needed for these, unlike `sex`/`reproductiveStatus`: `Species.name`/`Breed.name` are catalog data already stored in Spanish, not code-level enum values.
- The admin-only Species/Breed CRUD maintainer is deferred until basic authentication with roles exists. Both are read-only through the API today.

### Structured Tutor address

- `Tutor.address` (free text) was replaced with required `region`, `comuna` and `streetAddress`. The free-text field produced typos and let the "Ver dirección en Maps" link open Google Maps in the wrong country.
- Unlike Species/Breed, `region`/`comuna` are a **static in-code catalog** (`apps/api/src/data/chile-regions.ts`, 16 regions / 346 comunas, from SUBDERE's Código Único Territorial), not reference tables: Chile's political-administrative division does not need an admin maintainer. It is exposed read-only via `GET /api/regions` so mobile consumes the same source instead of duplicating it, and the Tutor schemas validate that the comuna belongs to the selected region with a Zod `.refine()` (no DB lookup, since it is not a foreign key).
- The Maps link always builds its query as `streetAddress, comuna, region, Chile`, shared through `formatTutorAddress`/`buildTutorMapsUrl` in `apps/mobile/src/features/patients/tutor-address.ts` so both detail screens build it identically.

### No delete endpoints for Tutor or Patient

`Patient.tutor` and `Consultation.patient` are `onDelete: Cascade`, so a hard delete of a Tutor or Patient would cascade-erase every related Patient, Consultation, HomeTreatment, FollowUp, VaccineRecord and Attachment with no way to undo it — and there is no authentication or mobile confirmation flow to guard against accidental or malicious use. This matches how veterinary and clinical SaaS products generally behave: they do not expose destructive cascading deletes from the app. Real deletions are handled manually against the database when genuinely needed. Update, implemented for both entities, covers the practical need to correct mis-entered data.

### Search

Patient search and Tutor search are separate user-facing modes. Patient search matches Patient fields only; Tutor search returns Tutors with their related Patients, for quick access to an existing pet.

## Current Capability State

This section is the bridge until an OpenSpec capability spec covers the same ground. When `openspec/specs/<capability>/spec.md` exists for one of these, delete its section from this file.

### Tutors

Implemented:
- Create: `POST /api/tutors`.
- List: `GET /api/tutors`.
- Search: `GET /api/tutors/search?q=...`, including related Patients with their Species and Breed.
- Detail: `GET /api/tutors/:id`, including related Patients with their Species and Breed.
- Update: `PUT /api/tutors/:id`, full-replace, `404` if missing.
- Duplicate RUT: `409` with `{ ok: false, message: "Ya existe un tutor con este RUT.", field: "rut" }`.
- Duplicate email: `409` with `{ ok: false, message: "Ya existe un tutor con este correo.", field: "email" }`.
- `addressComplement`: optional free-text field (apartment/floor/house detail), excluded from the Google Maps link.

Not implemented: delete (deliberate — see Technical Decisions).

### Patients

Implemented:
- Create: `POST /api/patients`.
- List: `GET /api/patients`.
- Search: `GET /api/patients/search?q=...`, by Patient fields.
- Detail: `GET /api/patients/:id`, including Tutor, Species, Breed and Consultations.
- Update: `PUT /api/patients/:id`, full-replace, `404` if missing.
- Create and update both validate that `tutorId`, `speciesId` and `breedId` exist (`404`) and that the breed belongs to the selected species (`400`).
- Every Patient read endpoint includes the related `Species` and `Breed`.

Not implemented: delete (deliberate — see Technical Decisions).

### Species / Breeds

Implemented:
- `GET /api/species`, read-only, ordered by name.
- `GET /api/breeds?speciesId=...`, read-only; `speciesId` is optional (omitted returns all breeds, ordered by species then name).
- Seeded catalog: Perro and Gato, with a starter breed list per species including a "Mestizo / Sin raza definida" fallback.

Not implemented: create, update and delete (deferred admin-only maintainer — depends on authentication with roles).

### Regions / Comunas

Implemented:
- `GET /api/regions`, read-only, returns the static Chile catalog (16 regions with their comunas).
- `Tutor.region`/`Tutor.comuna` are validated against this catalog on create and update.

## Partially Implemented

- **Consultations**: backend routes exist; there is no mobile create, edit or detail workflow.
- **Attachments**: upload and delete exist in the backend only; there is no mobile UI.
- **FollowUp and VaccineRecord**: can be nested when creating a Consultation through the backend, but have no dedicated UI flow.

## Risks Pending

- **No authentication or user account flow.** Anyone with the API URL has full read and write access to all Tutor and Patient data. This is the single largest gap before the system is usable outside a demo.
- **Test coverage is one file.** `apps/api/src/test/tutor-patient.api.test.ts` covers the Tutor, Patient, Species, Breed and Region flows. The `consultations` module has no coverage, and there are no mobile tests of any kind.
- **Validation error responses are not normalized** beyond the duplicate Tutor cases.
- **The tablet two-column layout was never verified on physical hardware.** It was checked on web viewports at 900px and 390px only; no Android tablet or emulator was available.
