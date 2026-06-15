# PROJECT_MEMORY.md

## Project Goal

Solu Vet is a Veterinary Practice Management System MVP. It must support veterinary clinics, veterinary hospitals, home-visit veterinarians, and mixed clinic/home-visit workflows. The current target is a functional MVP for Android phones and tablets first, with responsive Expo web support where practical. There is no Play Store deployment work yet.

## Architecture

The repository is an npm workspace monorepo:
- `apps/api`: Express API, Prisma schema, migrations, generated Prisma client, uploads, and backend modules.
- `apps/mobile`: Expo Router mobile app and mobile API service code.
- `packages/types`: Reserved workspace package; currently no shared source files.

Current MVP mobile flow:
1. Register Tutor and Patient in one screen.
2. Create Tutor first.
3. Use returned `tutor.id`.
4. Create Patient with `tutorId`.
5. Navigate to Patient detail.

## Stack

Frontend:
- React Native
- Expo
- TypeScript
- Expo Router
- Axios

Backend:
- Node.js
- Express
- TypeScript
- Zod

Database and ORM:
- PostgreSQL
- Prisma 7
- `@prisma/adapter-pg`
- Generated Prisma client in `apps/api/src/generated/prisma`

## Main Prisma Models

Implemented models:
- User
- Tutor
- Patient
- Consultation
- HomeTreatment
- FollowUp
- ConsultationDetail
- VaccineRecord
- Attachment

Important constraints:
- `Tutor.rut` is unique.
- `Tutor.email` is optional and unique.
- `Patient` belongs to `Tutor` through `tutorId`.
- Consultations are location-agnostic. Do not assume every consultation happens at the patient's home.

## Backend Status

Implemented foundation:
- Express app mounted under `/api`.
- Health endpoint at `/api/health`.
- CORS and JSON parsing configured.
- Central error handler for Zod, Multer, Prisma unique constraints, and generic errors.
- Prisma schema and initial migration exist.

Tutor API:
- `POST /api/tutors`: create Tutor.
- `GET /api/tutors`: list Tutors.
- Duplicate RUT returns `409` with `{ ok: false, message: "Ya existe un tutor con este RUT.", field: "rut" }`.
- Duplicate email returns `409` with `{ ok: false, message: "Ya existe un tutor con este correo.", field: "email" }`.
- Tutor detail, update, and delete are not implemented.

Patient API:
- `POST /api/patients`: create Patient.
- `GET /api/patients`: list Patients.
- `GET /api/patients/search?q=...`: search Patients.
- `GET /api/patients/:id`: detail with Tutor and Consultations.
- Patient update and delete are not implemented.

Consultation API exists for create, list, list by Patient, detail, update core fields/home treatment/detail, delete, attachment upload, and attachment delete.

## Mobile Status

Implemented:
- Home screen links to Patient search and Patient registration.
- Patient search calls the API and navigates to Patient detail.
- Patient registration creates Tutor, then creates Patient with returned `tutorId`.
- Patient detail loads API data and shows Tutor, Patient, consultation summary, Spanish enum labels, and Google Maps link from Tutor address.
- Duplicate Tutor RUT/email errors display near the corresponding mobile fields.
- Loading and validation states exist in Spanish.
- Main MVP screens use Spanish veterinarian-facing copy.

Important mobile rule:
- Patient inherits `lastName` from `tutorForm.lastName`.
- Do not add a visible Patient last-name input unless the business rule changes.
- Empty optional Tutor email is omitted from the request payload rather than sent as `""`.

## Completed Features

- Monorepo setup.
- Backend base architecture.
- Prisma schema and initial migration.
- Core Tutor and Patient create/list/search/detail backend flows.
- Consultation backend routes.
- Attachment upload/delete backend support.
- Mobile Patient search.
- Mobile Patient detail.
- Mobile Tutor + Patient registration flow.
- Spanish labels for Patient enum values in detail view.
- Clinic-neutral copy in touched MVP screens.
- Duplicate Tutor RUT/email API responses and mobile field-level display.

## Pending Features And Risks

- `apps/mobile/src/services/api.ts` hardcodes a local LAN IP address.
- Full mobile registration has not been verified end-to-end on a device in the latest audit.
- Automated tests are not implemented.
- Tutor and Patient update/delete endpoints are missing.
- Tutor detail endpoint is missing.
- Validation error responses are not fully normalized beyond duplicate Tutor cases.
- Tutor creation and Patient creation are separate API calls; if Patient creation fails after Tutor creation, the Tutor remains created.
- No authentication or user account flows exist.
- No mobile consultation create/edit workflow.
- No mobile attachment UI.

## Technical Decisions

- Do not change Prisma architecture, generated client location, or `prisma.config.ts` without a specific reason.
- Keep Prisma models, database fields, API routes, TypeScript identifiers, and internal documentation in English.
- Keep veterinarian-facing frontend UI text in Spanish.
- Map backend enum values to Spanish labels in the presentation layer.
- Keep domain generic for clinics, hospitals, home visits, and mixed workflows.
- Prefer small scoped changes over module rewrites.
- Use existing code patterns and avoid unnecessary libraries.

## Recommended Next Steps

1. Validate the complete Tutor + Patient registration flow from mobile against local API and database.
2. Move mobile API base URL out of hardcoded LAN IP configuration.
3. Add API tests for Tutor creation, duplicate RUT/email, Patient creation, Patient search, and Patient detail.
4. Add a manual smoke checklist for the mobile registration flow.
5. Decide how to handle orphan Tutors if Patient creation fails.
6. Improve Patient search empty/error states.
7. Implement Tutor and Patient update/delete only when needed by MVP workflows.
