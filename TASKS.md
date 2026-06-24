# TASKS.md

## IN PROGRESS

- None.

## NEXT

### Mobile
- [ ] Improve patient detail layout for phones and tablets.
- [ ] Move API base URL out of hardcoded LAN IP configuration.

### Backend
- [ ] Add tutor update endpoint.
- [ ] Add tutor delete endpoint.
- [ ] Add patient update endpoint.
- [ ] Add patient delete endpoint.
- [ ] Normalize validation error responses.

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

## Rules

When a task is completed:
1. Move it to DONE.
2. Update `PROJECT_STATUS.md` if the project reality changed.
3. Keep `TASKS.md` short and actionable.
