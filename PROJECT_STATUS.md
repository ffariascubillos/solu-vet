# PROJECT_STATUS.md

## Project Status

Last audited: 2026-06-13.

## Current Reality

The project is a small npm workspace monorepo with:
- `apps/api`: Express + TypeScript backend.
- `apps/mobile`: Expo Router + React Native mobile app.
- `packages/types`: Empty reserved workspace package.

TypeScript no-emit checks passed for both API and mobile during the last audit.

## Implemented

### Backend Foundation
- Express app mounted under `/api`.
- Health endpoint at `/api/health`.
- CORS and JSON body parsing configured.
- Central error handler for Zod and Multer errors.
- PostgreSQL configured through Prisma 7 and `@prisma/adapter-pg`.
- Prisma schema and initial migration exist.

### Data Model
- Prisma models exist for:
  - User
  - Tutor
  - Patient
  - Consultation
  - HomeTreatment
  - FollowUp
  - ConsultationDetail
  - VaccineRecord
  - Attachment

### Backend API
- Tutor API:
  - Create tutor
  - List tutors
- Patient API:
  - Create patient
  - List patients
  - Search patients
  - Get patient detail with tutor and consultations
- Consultation API:
  - Create consultation
  - List consultations
  - List consultations by patient
  - Get consultation detail
  - Update consultation core fields, home treatment, and consultation detail
  - Delete consultation
  - Upload consultation attachment
  - Delete attachment

### Mobile App
- Home screen links to patient search and patient registration route.
- Patient search screen calls the API and navigates to patient detail.
- Patient detail screen loads API data and shows tutor, patient, consultation summary, and a Google Maps link from tutor address.
- Patient creation route exists but is only a placeholder.

## Partially Implemented

- Attachment support exists in the backend only; there is no mobile attachment UI.
- Consultation support exists mostly in the backend only; there is no mobile consultation create/edit workflow.
- Follow-up and vaccine records can be nested when creating consultations through the backend, but there are no dedicated UI flows.
- The mobile app uses Spanish in several screens, but Expo template screens and some navigation labels still contain English.
- Patient detail displays raw backend enum values for sex and reproductive status instead of Spanish labels.

## Not Implemented

- Mobile tutor + patient registration flow.
- Mobile API methods for creating tutors and patients.
- Tutor detail, update, and delete endpoints.
- Patient update and delete endpoints.
- Authentication or user account flows.
- Automated tests.
- Environment-based mobile API URL configuration.
- Clinic-neutral mobile copy throughout the app.
- Production deployment or Play Store preparation.

## Known Issues

- `apps/mobile/src/services/api.ts` hardcodes a local LAN IP address.
- `apps/mobile/app/patients/create.tsx` is a placeholder.
- `apps/mobile/app/(tabs)/explore.tsx` still contains Expo starter content.
- `apps/mobile/app/(tabs)/_layout.tsx` uses English tab titles.
- `apps/mobile/app/patients/[id].tsx` duplicates tutor fields inside the consultations section.
- No live database verification was performed during the audit.
- The workspace is not currently a Git repository at this path, so git status could not be used.

## Current Priority

Implement and validate the mobile registration flow:
1. Create Tutor.
2. Receive `tutor.id`.
3. Create Patient with `tutorId`.
4. Navigate to the patient detail screen.

The flow must remain suitable for clinic, hospital, home-visit, and mixed workflows.
