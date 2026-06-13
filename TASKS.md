# TASKS.md

## IN PROGRESS

- [ ] Build mobile tutor + patient registration flow in `apps/mobile/app/patients/create.tsx`.
- [ ] Add mobile service methods for creating tutors and patients.
- [ ] Navigate to patient detail after patient creation.
- [ ] Add Spanish validation, loading, and error states to the registration flow.

## NEXT

### Mobile
- [ ] Replace raw patient enum values with Spanish labels.
- [ ] Remove or replace Expo starter `Explore` screen content.
- [ ] Change English tab labels to Spanish.
- [ ] Make home screen copy clinic-neutral.
- [ ] Remove duplicated tutor fields from patient detail consultation section.
- [ ] Move API base URL out of hardcoded LAN IP configuration.

### Backend
- [ ] Add tutor detail endpoint if needed.
- [ ] Add tutor update endpoint.
- [ ] Add tutor delete endpoint.
- [ ] Add patient update endpoint.
- [ ] Add patient delete endpoint.
- [ ] Normalize unique-constraint and validation error responses.

### Testing
- [ ] Add a smoke test or manual checklist for tutor + patient registration.
- [ ] Add API tests for tutor creation and patient creation.
- [ ] Add API tests for patient search and patient detail.
- [ ] Validate registration flow against a live local database.

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
- [x] Documentation audit completed.

## Rules

When a task is completed:
1. Move it to DONE.
2. Update `PROJECT_STATUS.md` if the project reality changed.
3. Keep `TASKS.md` short and actionable.
