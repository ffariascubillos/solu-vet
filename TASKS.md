# TASKS.md

## IN PROGRESS

- [ ] Validate complete tutor + patient registration end-to-end from the mobile app against a live local database.

## NEXT

### Mobile
- [ ] Improve patient search empty state.
- [ ] Improve patient search error state and retry behavior.
- [ ] Improve patient detail layout for phones and tablets.
- [ ] Move API base URL out of hardcoded LAN IP configuration.

### Backend
- [ ] Add tutor detail endpoint if needed.
- [ ] Add tutor update endpoint.
- [ ] Add tutor delete endpoint.
- [ ] Add patient update endpoint.
- [ ] Add patient delete endpoint.
- [ ] Decide how to handle orphan tutors if patient creation fails after tutor creation.
- [ ] Normalize validation error responses.

### Testing
- [ ] Add a smoke test or manual checklist for tutor + patient registration.
- [ ] Add API tests for tutor creation and patient creation.
- [ ] Add API tests for duplicate tutor RUT and duplicate tutor email responses.
- [ ] Add API tests for patient search and patient detail.
- [ ] Validate complete registration flow from the mobile app against a live local database.

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
- [x] Documentation audit completed.

## Rules

When a task is completed:
1. Move it to DONE.
2. Update `PROJECT_STATUS.md` if the project reality changed.
3. Keep `TASKS.md` short and actionable.
