# PROJECT_STATUS.md

## Project Status

Last audited: 2026-06-16.

## Current Reality

The project is an npm workspace monorepo with:
- `apps/api`: Express + TypeScript backend.
- `apps/mobile`: Expo Router + React Native mobile app.
- `packages/types`: Empty reserved workspace package.

The latest local checks passed:
- `npm exec -w apps/api -- tsc --noEmit`
- `npm exec -w apps/mobile -- tsc --noEmit`
- `npm run lint -w apps/mobile`

## Completed Today

- Built the mobile Tutor + Patient registration flow in `apps/mobile/app/patients/create.tsx`.
- Added mobile API service methods for creating Tutors and Patients.
- Implemented the registration sequence: create Tutor, receive `tutor.id`, create Patient with `tutorId`, then navigate to Patient detail.
- Added Spanish validation, loading, and error states to the registration flow.
- Preserved the business rule that Patient inherits `lastName` from `tutorForm.lastName`; no visible Patient last-name input exists.
- Ensured empty Tutor email from mobile is omitted from the payload instead of being sent as an empty string.
- Added explicit duplicate Tutor checks for `rut` and `email` in the Tutor create controller.
- Added predictable `409 Conflict` responses for duplicate Tutor RUT and duplicate Tutor email.
- Updated mobile duplicate-error handling so RUT/email errors are displayed next to the corresponding field.
- Kept a mobile global error fallback for unexpected API errors.
- Manually validated the complete Tutor + Patient registration flow from the mobile app against the local API and database.
- Confirmed duplicate Tutor RUT and duplicate Tutor email validation from the mobile app.
- Replaced raw Patient enum values with Spanish labels in Patient detail.
- Removed duplicated Tutor fields from the Patient detail consultations section.
- Replaced Expo starter `Explore` tab content with a Spanish app guide screen.
- Changed mobile tab labels to Spanish.
- Updated home and detail copy to stay neutral for clinics, hospitals, home-visit, and mixed workflows.

## Problems Resolved

- Duplicate Tutor RUT no longer falls through to a generic mobile error.
- Duplicate Tutor email no longer falls through to a generic mobile error.
- Prisma `P2002` metadata was not reliable enough to identify the duplicated field in the current runtime; duplicate checks now happen explicitly before Tutor creation.
- Mobile now consumes `field` and `message` from API `409` responses.
- If the API returns a `409` message without a recognized field, mobile shows that message globally instead of replacing it with the generic fallback.
- Patient detail no longer exposes backend enum values such as `MALE`, `FEMALE`, `STERILIZED`, or `NOT_STERILIZED` directly to users.
- Mobile screens touched by the MVP flow no longer assume that every consultation happens at the patient's home.

## Technical Decisions

- Prisma schema, models, relations, routes, and generation strategy were not changed.
- `Tutor.rut` remains `@unique`.
- `Tutor.email` remains `@unique`.
- Duplicate Tutor validation is handled in `createTutor()` with explicit `findUnique()` checks for `rut` and `email`.
- Central Prisma `P2002` handling remains in `error-handler.ts` as a fallback for concurrent duplicate writes.
- User-facing mobile messages remain in Spanish.
- API route names, TypeScript names, Prisma models, and internal technical documentation remain in English.
- Mobile registration keeps the two-step API flow instead of introducing a combined Tutor + Patient endpoint.
- Mobile sends empty optional Tutor email as `undefined`, so it is omitted from the JSON request body.

## Current CRUD State

### Tutors

Implemented:
- Create Tutor: `POST /api/tutors`.
- List Tutors: `GET /api/tutors`.
- Duplicate RUT response: `409 Conflict` with `{ ok: false, message: "Ya existe un tutor con este RUT.", field: "rut" }`.
- Duplicate email response: `409 Conflict` with `{ ok: false, message: "Ya existe un tutor con este correo.", field: "email" }`.

Not implemented:
- Get Tutor by ID.
- Update Tutor.
- Delete Tutor.

### Patients

Implemented:
- Create Patient: `POST /api/patients`.
- List Patients: `GET /api/patients`.
- Search Patients: `GET /api/patients/search?q=...`.
- Get Patient detail: `GET /api/patients/:id`, including Tutor and Consultations.
- Create Patient validates that `tutorId` exists before insertion.

Not implemented:
- Update Patient.
- Delete Patient.

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
- Consultation
- HomeTreatment
- FollowUp
- ConsultationDetail
- VaccineRecord
- Attachment

## Implemented Mobile App

- Home screen links to Patient search and Patient registration.
- Patient search calls the API and navigates to Patient detail.
- Patient registration creates Tutor first, then creates Patient with the returned `tutorId`.
- Patient registration shows Spanish field-level duplicate errors for Tutor RUT and Tutor email.
- Patient registration shows loading state while saving.
- Patient detail loads API data and shows Tutor, Patient, consultation summary, Spanish enum labels, and a Google Maps link from Tutor address.
- Main MVP screens use Spanish veterinarian-facing copy.

## Partially Implemented

- Attachment support exists in the backend only; there is no mobile attachment UI.
- Consultation support exists mostly in the backend only; there is no mobile consultation create/edit workflow.
- Follow-up and vaccine records can be nested when creating consultations through the backend, but there are no dedicated UI flows.
- Search UX is functional, but empty-state and retry polish remain limited.

## Verified Today

- TypeScript API check passed.
- TypeScript mobile check passed.
- Mobile lint passed.
- Complete Tutor + Patient registration flow was manually validated from the mobile app against the local API and database.
- Duplicate Tutor RUT response was verified against the local API and database.
- Duplicate Tutor email response was verified against the local API and database.

## Risks Pending

- `apps/mobile/src/services/api.ts` still hardcodes a local LAN IP address.
- Automated test coverage has not been added.
- Tutor creation and Patient creation are separate API calls; if Patient creation fails after Tutor creation, the Tutor remains created.
- There is no authentication or user account flow.
- Validation error responses are still not fully normalized beyond the duplicate Tutor cases.
- Update/delete endpoints for Tutors and Patients are not implemented.

## Recommended Next Steps

1. Add a smoke test or manual checklist for Tutor + Patient registration.
2. Add API tests for Tutor creation duplicate RUT/email behavior.
3. Add API tests for Patient creation, Patient search, and Patient detail.
4. Move the mobile API base URL out of hardcoded LAN IP configuration.
5. Improve Patient search empty and error states.
6. Implement Tutor detail/update/delete only when needed by the MVP workflow.
7. Implement Patient update/delete when the MVP requires record correction workflows.
