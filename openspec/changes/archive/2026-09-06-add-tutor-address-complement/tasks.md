## 1. Database

- [x] 1.1 Add `addressComplement String?` to the `Tutor` model in `apps/api/prisma/schema.prisma`, directly below `streetAddress`.
- [x] 1.2 Run `npm run prisma:migrate -w apps/api` to create and apply the migration (dev database), and verify it applies cleanly to `solu_vet_test` as well (the same database `src/test/setup.ts` points integration tests at) — no truncation needed since the column is nullable.
- [x] 1.3 Run `npm run prisma:generate -w apps/api` and verify the generated Prisma client exposes `addressComplement` on `Tutor`.

## 2. Backend validation

- [x] 2.1 Add `addressComplement: z.string().trim().optional()` to `createTutorSchema` and `updateTutorSchema` in `apps/api/src/modules/tutors/tutors.schemas.ts`. No controller change is needed — `createTutor`/`updateTutor` already spread the full parsed `data` object into `prisma.tutor.create`/`update`.

## 3. Mobile types and form state

- [x] 3.1 Add `addressComplement?: string | null` to the `Tutor` type and `addressComplement?: string` to `CreateTutorInput` in `apps/mobile/src/types/patient.ts`.
- [x] 3.2 Add `addressComplement: string` to `TutorForm`, `initialTutorForm`, and `toTutorFormState()` in `apps/mobile/src/features/patients/registration.types.ts` (default `''`, hydrated from `tutor.addressComplement ?? ''` on edit).

## 4. Mobile form UI

- [x] 4.1 In `apps/mobile/src/features/patients/components/TutorForm.tsx`, add an optional `TextInput` labeled "Complemento (Casa, Depto, Piso, etc.)" directly below the "Calle y número" input, following the existing style/pattern (no `error`/`HelperText`, since the field has no validation). Verify `npm exec -w apps/mobile -- tsc --noEmit` passes.

## 5. Mobile create/edit payload

- [x] 5.1 In `apps/mobile/app/(drawer)/(tabs)/tutors/create.tsx` and `.../tutors/edit.tsx`, include `addressComplement: tutorForm.addressComplement.trim() || undefined` in the submitted payload, matching the existing `email` omission convention.

## 6. Mobile display

- [x] 6.1 In `apps/mobile/app/(drawer)/(tabs)/tutors/[id].tsx`, add a line rendering `Complemento: {tutor.addressComplement}` directly after the "Dirección: ..." line, rendered only when `tutor.addressComplement` is present.
- [x] 6.2 In `apps/mobile/app/(drawer)/(tabs)/patients/[id].tsx`, add the equivalent line using `patient.tutor.addressComplement`, in the same position relative to "Dirección: ...".
- [x] 6.3 Confirm `apps/mobile/src/features/patients/tutor-address.ts` (`formatTutorAddress`, `buildTutorMapsUrl`) is unmodified — grep the diff for that file and verify it shows no changes.

## 7. Tests

- [x] 7.1 In `apps/api/src/test/tutor-patient.api.test.ts`, add a case creating a Tutor with `addressComplement` set and asserting it is persisted and returned.
- [x] 7.2 Add a case creating a Tutor without `addressComplement` and asserting the Tutor is created successfully with a `null`/absent value.
- [x] 7.3 Add a case updating a Tutor to add or change `addressComplement` via `PUT /api/tutors/:id`, asserting the new value is returned.
- [x] 7.4 Run `npm test -w apps/api` and verify all tests, including the new ones, pass.

## 8. Verification

- [x] 8.1 Run `npm exec -w apps/api -- tsc --noEmit`, `npm exec -w apps/mobile -- tsc --noEmit`, and `npm run lint -w apps/mobile`; all must pass.
- [x] 8.2 Manually register a Tutor with an address complement and confirm: the field appears below "Calle y número", Tutor detail and Patient detail show the "Complemento: ..." line, and the "Ver dirección en Maps" link's query does not contain the complement value.
- [x] 8.3 Manually register or edit a Tutor leaving the complement empty and confirm no "Complemento" line appears anywhere.

## 9. Documentation

- [x] 9.1 Add `addressComplement` (optional) to the "Tutors" section of `PROJECT_STATUS.md` under Current Capability State.
