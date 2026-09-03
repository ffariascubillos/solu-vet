# TASKS.md

## IN PROGRESS

- None.

## NEXT

### Mobile
- [ ] Manually verify the new Tutor/Patient edit screens on an Android phone via Expo Go (edit success, duplicate rut/email error, species/breed cascade reset, validation errors).
- [ ] Fix `settings.tsx` (reachable from the drawer menu): it currently renders a duplicate of the "Guía rápida" content instead of an actual settings screen. Found while fixing the white-card styling below; not fixed yet since it's an unrelated content bug.

### Backend
Agreed priority order: Tutor/Patient update first, then basic authentication — neither exists yet and both are prerequisites for a usable (non-demo) system. Delete endpoints for Tutor/Patient were deliberately not implemented (see DONE note below).
- [ ] Add basic authentication (no auth flow exists today; anyone with the API URL has full access to Tutor/Patient data).
- [ ] Normalize validation error responses.
- [ ] Add an admin-only CRUD maintainer for species and breeds (create, search, update, delete). Depends on basic authentication with roles, since there is no way to restrict anything to administrators yet.
- [ ] Evaluate Google Places Autocomplete (restricted to Chile) for exact-pin address precision on home visits. Deferred: requires a Google Cloud project, billing, an API key proxied through the backend, and a new mobile dependency.

### Testing
- None.

## DONE

- [x] Monorepo workspace configured.
- [x] Backend base architecture created.
- [x] Prisma schema created.
- [x] Initial Prisma migration created.
- [x] Tutor model created.
- [x] Patient model created.
- [x] Consultation-related models created.
- [x] Tutor create and list endpoints created.
- [x] Patient create, list, search, and detail endpoints created.
- [x] Consultation backend routes created.
- [x] Backend attachment upload/delete support created.
- [x] Patient search screen created.
- [x] Patient detail screen created.
- [x] Google Maps link from tutor address added.
- [x] Mobile tutor + patient registration flow created.
- [x] Mobile service methods for creating tutors and patients added.
- [x] Registration flow creates Tutor, uses returned `tutor.id`, creates Patient with `tutorId`, and navigates to Patient detail.
- [x] Spanish validation, loading, and error states added to registration flow.
- [x] Raw patient enum values replaced with Spanish labels in Patient detail.
- [x] Expo starter `Explore` screen replaced with Spanish app guide.
- [x] Tab labels changed to Spanish.
- [x] Home screen copy made clinic-neutral.
- [x] Duplicated tutor fields removed from Patient detail consultation section.
- [x] Predictable unique-constraint error response added for duplicate Tutor RUT/email handling.
- [x] Duplicate Tutor RUT/email errors are shown near the corresponding mobile form field.
- [x] Duplicate Tutor RUT/email responses verified against the local API and database.
- [x] Complete Tutor + Patient registration flow manually validated from the mobile app against the local API and database.
- [x] Manual API smoke test completed: Tutor create 201, duplicate RUT 409, duplicate email 409, Patient create with valid tutorId 201, Patient create with missing tutorId 404, Patient search works, and Patient detail works.
- [x] API integration tests added for tutor creation and patient creation.
- [x] API integration tests added for duplicate tutor RUT and duplicate tutor email responses.
- [x] API integration tests added for patient search and patient detail.
- [x] Chilean RUT format validation added to the Tutor create API endpoint.
- [x] Mobile Tutor + Patient registration form split into separate steps.
- [x] Unused Expo starter mobile files and dependencies removed.
- [x] Documentation audit completed.
- [x] Patient lookup split into Patient and Tutor search modes.
- [x] Patient search empty, error, loading, and retry states improved.
- [x] Tutor search displays related Patients and opens Patient detail.
- [x] Tutor search API added with related Patients included.
- [x] Registration flow can add multiple Patients for the same saved Tutor.
- [x] API integration tests added for Tutor search and multiple Patients per Tutor.
- [x] Tutor detail API added with related Patients included.
- [x] Mobile Tutor detail screen added with related Patients and Patient detail links.
- [x] Registration flow now finalizes on Tutor detail after adding one or more Patients.
- [x] Tutor detail can open Patient-only registration for the selected Tutor.
- [x] API integration tests added for Tutor detail success and missing Tutor.
- [x] Tutor detail refreshes after adding a Patient from the Tutor detail flow.
- [x] Tutor detail add-Patient action reliably opens the Patient-only registration step.
- [x] Decided that Tutors without Patients are valid records; Tutor registration will finish on Tutor detail and Patients will be added from there.
- [x] Created a dedicated Tutor registration screen.
- [x] Simplified Patient registration so it only creates Patients for a selected Tutor.
- [x] Updated main registration navigation to open Tutor registration first.
- [x] Verified Tutor registration and Patient-only registration with mobile TypeScript and lint.
- [x] Moved mobile API base URL out of hardcoded LAN IP into `EXPO_PUBLIC_API_URL` (`apps/mobile/.env`, with `apps/mobile/.env.example` as template).
- [x] Converted `Patient.species` and `Patient.breed` from free text to `Species`/`Breed` reference tables, seeded with an initial Perro/Gato catalog, with read-only `GET /api/species` and `GET /api/breeds?speciesId=...` endpoints and mobile pickers replacing the free-text inputs.
- [x] Converted `Tutor.address` (free text) into `region`/`comuna` selects (static 16-region/346-comuna Chile catalog, read-only `GET /api/regions`) plus a `streetAddress` field, fixing the Google Maps link opening in the wrong country.
- [x] Added tutor update endpoint (`PUT /api/tutors/:id`) with duplicate rut/email checks that exclude the tutor's own record, and API integration tests covering success, missing tutor, rut/email conflicts with another tutor, keeping own rut/email, and region/comuna and rut validation.
- [x] Added patient update endpoint (`PUT /api/patients/:id`), reusing `createPatientSchema` and the same tutor/species/breed existence and species-match validation as `createPatient`, with API integration tests covering success and each 404/400 validation case.
- [x] Decided not to implement delete endpoints for Tutor or Patient: `Patient.tutor` and `Consultation.patient` use `onDelete: Cascade`, so a hard delete would cascade-erase a tutor's or patient's entire clinical history with no undo and no auth/confirmation in place yet. Real deletions are handled manually against the database for now, consistent with how veterinary/clinical SaaS products generally avoid exposing destructive cascading deletes from the app.
- [x] Added mobile "Editar" screens for Tutor and Patient (`tutors/edit.tsx`, `patients/edit.tsx`), reusing `TutorForm`/`PatientForm` unchanged and calling the existing `PUT` endpoints via new `updateTutor`/`updatePatient` service functions. Added an "Editar" button to both detail screens. Patient's Tutor is fixed (not reassignable) in this flow. Fixed Patient detail to use `useFocusEffect` instead of a plain `useEffect` so it refreshes after returning from edit (it previously only refetched on `id` change, same gap already fixed for Tutor detail earlier).
- [x] Hid `tutors/edit`/`patients/edit` from the bottom tab bar (`(tabs)/_layout.tsx`): Expo Router auto-registers every route file as a tab unless explicitly given `href: null`, which these two were missing.
- [x] Replaced white cards/text on dark background with the app's existing dark-card palette (`#1E293B` card, `#334155` border, `colors.text`/`colors.muted` text) in `ayuda.tsx`, `tutors/[id].tsx`, `patients/[id].tsx`, and `patients/search.tsx` (including nested patient rows and the "Ver ficha del tutor" button's text color).
- [x] Improved Patient detail and Tutor detail layout for tablets: added a shared `useIsTablet()` hook (`apps/mobile/src/hooks/useIsTablet.ts`, `useWindowDimensions` at a 600dp breakpoint — Android's `sw600dp` convention) and, at tablet width, arranged Patient detail's "Datos del paciente"/"Tutor" cards and Tutor detail's "Datos del tutor"/"Mascotas" cards side by side (unequal heights allowed), with "Consultas" staying full-width below on Patient detail. Below 600dp both screens keep their existing single-column stack unchanged.

## Rules

When a task is completed:
1. Move it to DONE.
2. Update `PROJECT_STATUS.md` if the project reality changed.
3. Keep `TASKS.md` short and actionable.
