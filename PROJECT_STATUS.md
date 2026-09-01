# PROJECT_STATUS.md

## Project Status

Last audited: 2026-09-01.

## Current Reality

The project is an npm workspace monorepo with:
- `apps/api`: Express + TypeScript backend.
- `apps/mobile`: Expo Router + React Native mobile app.
- `packages/types`: Empty reserved workspace package.

The latest local checks passed:
- `npm exec -w apps/api -- tsc --noEmit`
- `npm test -w apps/api`
- `npm exec -w apps/mobile -- tsc --noEmit`
- `npm run lint -w apps/mobile`

## Completed Today

- Built the mobile Tutor + Patient registration flow in `apps/mobile/app/patients/create.tsx`.
- Added mobile API service methods for creating Tutors and Patients.
- Implemented the registration sequence: create Tutor, receive `tutor.id`, create Patient with `tutorId`, then finish on Tutor detail.
- Added Spanish validation, loading, and error states to the registration flow.
- Preserved the business rule that Patient inherits `lastName` from `tutorForm.lastName`; no visible Patient last-name input exists.
- Ensured empty Tutor email from mobile is omitted from the payload instead of being sent as an empty string.
- Added explicit duplicate Tutor checks for `rut` and `email` in the Tutor create controller.
- Added predictable `409 Conflict` responses for duplicate Tutor RUT and duplicate Tutor email.
- Updated mobile duplicate-error handling so RUT/email errors are displayed next to the corresponding field.
- Kept a mobile global error fallback for unexpected API errors.
- Manually validated the complete Tutor + Patient registration flow from the mobile app against the local API and database.
- Confirmed duplicate Tutor RUT and duplicate Tutor email validation from the mobile app.
- Completed a manual API smoke test with Postman for Tutor create, duplicate Tutor RUT/email, Patient create with valid and missing `tutorId`, Patient search, and Patient detail.
- Removed `PROJECT_MEMORY.md` to avoid duplicated and stale project status documentation.
- Created `README.md` with basic project commands.
- Replaced raw Patient enum values with Spanish labels in Patient detail.
- Removed duplicated Tutor fields from the Patient detail consultations section.
- Replaced Expo starter `Explore` tab content with a Spanish app guide screen.
- Changed mobile tab labels to Spanish.
- Updated home and detail copy to stay neutral for clinics, hospitals, home-visit, and mixed workflows.
- Added API integration tests for the current Tutor and Patient smoke-test behavior.
- Applied the existing Prisma migration to the local `solu_vet_test` database.
- Added backend Chilean RUT validation and normalization for Tutor creation.
- Split the mobile Tutor + Patient registration screen into separate Tutor and Patient steps.
- Removed unused Expo starter mobile files and dependencies.
- Updated the mobile tab layout to match the current Patient routes.
- Added separated mobile search modes for Patient and Tutor lookup.
- Added Tutor search API with related Patients included.
- Updated Patient search so it searches Patient fields only.
- Added mobile search empty, error, loading, and retry states.
- Updated mobile registration so one Tutor can register multiple Patients in sequence without duplicating the Tutor.
- Added Tutor detail API with related Patients included.
- Added mobile Tutor detail screen with Tutor data, related Patients, Patient detail links, and an add-Patient action.
- Updated mobile registration finalization so Tutor + Patient(s) redirects to Tutor detail instead of the latest Patient detail.
- Updated mobile registration so `patients/create?tutorId=...` loads the selected Tutor and shows only the Patient step.
- Added API integration tests for Tutor detail success and missing Tutor.
- Fixed Tutor detail refresh after adding a Patient from the Tutor detail flow.
- Fixed add-Patient navigation from Tutor detail so it reliably opens the Patient-only registration step.
- Accepted that Tutors without Patients are valid MVP records.
- Separated mobile Tutor registration into its own screen.
- Simplified mobile Patient registration so it only creates Patients for an existing Tutor.
- Updated main registration navigation to open Tutor registration first.
- Updated the empty search registration action to open Tutor registration.
- Verified the mobile TypeScript check and mobile lint after separating the flow.
- Manually validated the separated Tutor registration and Patient-from-Tutor flow.
- Replaced `Patient.species` (free text) and `Patient.breed` (free text) with `Species` and `Breed` reference tables and required foreign keys (`Patient.speciesId`, `Patient.breedId`).
- Seeded an initial `Species`/`Breed` catalog (Perro, Gato, and a handful of common breeds per species, including a "Mestizo / Sin raza definida" fallback per species) via a new Prisma seed script.
- Added read-only `GET /api/species` and `GET /api/breeds?speciesId=...` endpoints.
- Added explicit `Species`/`Breed` existence and species-match validation in `createPatient` (404 for missing species/breed, 400 when a breed doesn't belong to the selected species).
- Replaced the mobile Patient registration form's free-text "Especie"/"Raza" inputs with dependent selects (species loads on mount, breed reloads when species changes) using a new reusable `SelectField` component built on `react-native-paper`'s `Menu`.
- Updated Patient detail, Tutor detail, and Patient search screens to render `species.name`/`breed.name` instead of raw free text.
- Added API integration tests for species/breed existence, species-mismatch, and the new `/api/species` and `/api/breeds` endpoints.
- Fixed a crash found during manual phone testing: `searchTutors` and `getTutorById` in `tutors.controller.ts` returned nested `patients` without `species`/`breed` included, so the mobile Tutor detail screen and Tutor search (nested Patient rows) threw `Cannot read property 'name' of undefined`.

## Problems Resolved

- Duplicate Tutor RUT no longer falls through to a generic mobile error.
- Duplicate Tutor email no longer falls through to a generic mobile error.
- Prisma `P2002` metadata was not reliable enough to identify the duplicated field in the current runtime; duplicate checks now happen explicitly before Tutor creation.
- Mobile now consumes `field` and `message` from API `409` responses.
- If the API returns a `409` message without a recognized field, mobile shows that message globally instead of replacing it with the generic fallback.
- Patient detail no longer exposes backend enum values such as `MALE`, `FEMALE`, `STERILIZED`, or `NOT_STERILIZED` directly to users.
- Mobile screens touched by the MVP flow no longer assume that every consultation happens at the patient's home.
- Tutor detail now refreshes when returning from Patient registration, so newly added Patients appear immediately.
- Adding a Patient from Tutor detail now reliably opens the Patient step with the Tutor preselected.
- The mobile API client no longer hardcodes a LAN IP in source; it reads `EXPO_PUBLIC_API_URL` from `apps/mobile/.env`, so switching networks or devices no longer requires editing code.
- Tutor detail and Tutor search now include `species`/`breed` on each nested Patient (`prisma.tutor.findUnique`/`findMany` in `tutors.controller.ts`), matching what the Patient endpoints already did — fixes the mobile crash reading `patient.species.name` when `species` came back `undefined`.

## Technical Decisions

- Prisma schema, models, relations, routes, and generation strategy were not changed.
- Tutors without Patients are valid MVP records.
- The orphan Tutor risk will be handled in the mobile workflow by making Tutor registration independent and finishing on Tutor detail.
- Patient registration will start from an existing Tutor, usually from Tutor detail, instead of using a combined Tutor + Patient submit flow.
- No combined Tutor + Patient endpoint or backend transaction is planned for this MVP flow.
- `Tutor.rut` remains `@unique`.
- Tutor RUT values are normalized and validated in the API before Tutor creation.
- `Tutor.email` remains `@unique`.
- Duplicate Tutor validation is handled in `createTutor()` with explicit `findUnique()` checks for `rut` and `email`.
- Central Prisma `P2002` handling remains in `error-handler.ts` as a fallback for concurrent duplicate writes.
- User-facing mobile messages remain in Spanish.
- API route names, TypeScript names, Prisma models, and internal technical documentation remain in English.
- Mobile registration uses separate Tutor and Patient screens instead of introducing a combined Tutor + Patient endpoint.
- Mobile sends empty optional Tutor email as `undefined`, so it is omitted from the JSON request body.
- Patient search and Tutor search are separate user-facing modes.
- Tutor search returns Tutors with their related Patients for quick access to existing pets.
- Tutor detail is now the completion surface after creating a Tutor.
- Adding a Patient from Tutor detail reuses the Patient registration screen with the Tutor preselected.
- `species` and `breed` are reference tables (`Species`, `Breed`), not a Prisma enum, because a future admin-only maintainer should be able to add new species/breeds without a database migration or app release — an enum would require both for every new value, a table only requires a row insert.
- `Patient.speciesId` and `Patient.breedId` are both required (not optional): every patient must have a species and a breed. The seed catalog includes a "Mestizo / Sin raza definida" breed per species so "I don't know the exact breed" is always a valid choice without leaving the field empty.
- The species/breed CRUD maintainer for administrators is deferred until basic authentication with roles exists — today `Species`/`Breed` are read-only via the API.
- No mapping from English to Spanish is needed for `species`/`breed` in the UI, unlike `sex`/`reproductiveStatus`: `Species.name`/`Breed.name` are catalog data stored and shown directly in Spanish, not fixed code-level enum values.

## Current CRUD State

### Tutors

Implemented:
- Create Tutor: `POST /api/tutors`.
- List Tutors: `GET /api/tutors`.
- Search Tutors: `GET /api/tutors/search?q=...`, including related Patients.
- Get Tutor detail: `GET /api/tutors/:id`, including related Patients.
- Duplicate RUT response: `409 Conflict` with `{ ok: false, message: "Ya existe un tutor con este RUT.", field: "rut" }`.
- Duplicate email response: `409 Conflict` with `{ ok: false, message: "Ya existe un tutor con este correo.", field: "email" }`.

Not implemented:
- Update Tutor.
- Delete Tutor.

### Patients

Implemented:
- Create Patient: `POST /api/patients`.
- List Patients: `GET /api/patients`.
- Search Patients: `GET /api/patients/search?q=...` by Patient fields.
- Get Patient detail: `GET /api/patients/:id`, including Tutor, Species, Breed, and Consultations.
- Create Patient validates that `tutorId` exists before insertion.
- Create Patient validates that `speciesId` exists, `breedId` exists, and the breed belongs to the selected species before insertion.
- All Patient read endpoints (`GET /api/patients`, `GET /api/patients/search`, `GET /api/patients/:id`) include the related `Species` and `Breed` records.

Not implemented:
- Update Patient.
- Delete Patient.

### Species / Breeds

Implemented:
- List Species: `GET /api/species`, read-only, ordered by name.
- List Breeds: `GET /api/breeds?speciesId=...`, read-only; `speciesId` is optional (omitted returns all breeds, ordered by species then name).
- Seeded catalog: Perro and Gato, with a small starter breed list per species including a "Mestizo / Sin raza definida" fallback.

Not implemented:
- Create/update/delete Species or Breed (deferred admin-only maintainer, depends on basic authentication with roles).

## Implemented Backend Foundation

- Express app mounted under `/api`.
- Health endpoint at `/api/health`.
- CORS and JSON body parsing configured.
- Central error handler for Zod, Multer, Prisma unique constraints, and generic errors.
- PostgreSQL configured through Prisma 7 and `@prisma/adapter-pg`.
- Prisma schema and initial migration exist.

## Implemented Data Model

Prisma models exist for:
- User
- Tutor
- Patient
- Species
- Breed
- Consultation
- HomeTreatment
- FollowUp
- ConsultationDetail
- VaccineRecord
- Attachment

## Implemented Mobile App

- Home screen links to Patient search and Tutor registration.
- Patient search calls the API and navigates to Patient detail.
- Patient search has separate Patient and Tutor modes, with empty, error, loading, and retry states.
- Tutor search displays related Patients and opens Patient detail or Tutor detail from the Tutor result.
- Tutor registration creates a Tutor and navigates to Tutor detail.
- Tutor registration shows Spanish validation, loading, and duplicate RUT/email field errors.
- Patient registration starts from a selected Tutor, creates only a Patient with that `tutorId`, and returns to Tutor detail.
- Patient registration shows loading state while saving.
- Tutor detail loads API data and shows Tutor information, all related Patients, Patient detail links, Maps link, and an add-Patient action.
- Patient detail loads API data and shows Tutor, Patient, consultation summary, Spanish enum labels, and a Google Maps link from Tutor address.
- Main MVP screens use Spanish veterinarian-facing copy.

## Partially Implemented

- Attachment support exists in the backend only; there is no mobile attachment UI.
- Consultation support exists mostly in the backend only; there is no mobile consultation create/edit workflow.
- Follow-up and vaccine records can be nested when creating consultations through the backend, but there are no dedicated UI flows.
- Search UX now has separate Patient and Tutor modes with empty, error, loading, and retry states.

## Verified Today

- TypeScript API check passed.
- API integration tests passed with 15 tests.
- TypeScript mobile check passed.
- Mobile lint passed.
- Tutor detail refresh and preselected-Tutor Patient registration fix passed mobile TypeScript and lint checks.
- Separate Tutor registration and Patient-only registration passed mobile TypeScript and lint checks.
- Manual testing confirmed the separated Tutor registration and Patient-from-Tutor flow works correctly.
- API integration tests required an elevated rerun because Vitest hit `spawn EPERM` inside the sandbox.
- Live phone testing with Expo Go passed against the local API.
- Patient search by Patient mode worked from the phone.
- Patient search by Tutor mode worked from the phone and opened related Patient detail.
- Tutor + first Patient registration worked from the phone.
- Adding another Patient for the same saved Tutor worked from the phone.
- Opening the latest registered Patient detail after registration worked from the phone before the Tutor detail redirect change.
- Complete Tutor + Patient registration flow was manually validated from the mobile app against the local API and database.
- Duplicate Tutor RUT response was verified against the local API and database.
- Duplicate Tutor email response was verified against the local API and database.
- Manual API smoke test passed: Tutor create `201`, duplicate Tutor RUT `409`, duplicate Tutor email `409`, Patient create with valid `tutorId` `201`, Patient create with missing `tutorId` `404`, Patient search works, and Patient detail works.
- Moved the mobile API base URL out of a hardcoded LAN IP into `EXPO_PUBLIC_API_URL`, read from `apps/mobile/.env` (not versioned; `apps/mobile/.env.example` documents the expected format for LAN, Android emulator, and web/localhost). `apps/mobile/src/services/api.ts` now throws a clear error at startup if the variable is missing instead of silently pointing at the wrong network.
- API TypeScript check, API integration tests (21 tests, including the new Species/Breed coverage), mobile TypeScript check, and mobile lint all passed after converting `Patient.species`/`Patient.breed` to the `Species`/`Breed` reference tables.
- The `Patient` table (local dev and `solu_vet_test`) was truncated before applying the migration, since the existing free-text `species` values could not be cast to the new required foreign keys; there was no production data at risk.
- Live phone testing with Expo Go against the local API confirmed the full Species/Breed flow end to end: Patient registration with the new species/breed selects, Patient detail, Tutor detail with related Patients, and Patient/Tutor search — including the `tutors.controller.ts` include fix, verified after a crash was found and fixed during this same testing session.

## Risks Pending

- Automated API test coverage is initial and focused on the Tutor and Patient MVP smoke flow.
- There is no authentication or user account flow.
- Validation error responses are still not fully normalized beyond the duplicate Tutor cases.
- Update/delete endpoints for Tutors and Patients are not implemented.

## Recommended Next Steps

Agreed priority order: (1) Tutor/Patient update and delete endpoints, (2) basic authentication, since neither exists yet and both are prerequisites for a usable (non-demo) system. The Species/Breed data model change (this session) was done ahead of this order because it was a blocking data-quality fix for the Patient registration form.

1. Implement Tutor update/delete.
2. Implement Patient update/delete.
3. Add basic authentication (no auth flow exists today; anyone with the API URL has full access to Tutor/Patient data).
4. Add the admin-only Species/Breed CRUD maintainer (depends on step 3).
5. Improve Patient detail layout for phones and tablets.
