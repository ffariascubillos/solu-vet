## Why

`Tutor` addresses today only capture `region`, `comuna`, and `streetAddress`. There is no field for "Depto 302", "Casa B", "Piso 4", etc. When a home visit or a product drop-off needs to reach a specific unit inside a building, the vet has no structured place to look that up — it would live only in whatever the tutor said verbally at registration time, if anywhere.

## What Changes

- Add an optional `addressComplement` field to `Tutor`: free text, no format validation, for apartment/floor/unit detail (e.g., "Depto 302", "Casa B").
- Add the field to Tutor registration and Tutor edit (`TutorForm`), placed directly below "Calle y número".
- Show it in Tutor detail and Patient detail as its own line near "Dirección", only when present.
- **Explicitly excluded**: `addressComplement` is not part of `formatTutorAddress()`'s single-line address string or `buildTutorMapsUrl()`'s Maps query. It has no effect on the Google Maps link — confirmed with the user.

## Capabilities

### New Capabilities

- `tutor-address-complement`: an optional, freeform "unit detail" field on a Tutor's address (apartment, floor, house identifier), captured at registration and shown in Tutor/Patient detail, kept separate from the address string used to build the Google Maps link.

### Modified Capabilities

None. No existing capability spec covers Tutor or its address today (region/comuna/streetAddress predate OpenSpec adoption in this project); this does not change the Maps-link behavior, which also has no existing spec.

## Impact

- `apps/api/prisma/schema.prisma` — `Tutor.addressComplement String?` (nullable, additive migration; no existing data needs to change, unlike the earlier region/comuna/streetAddress migration which required truncation).
- `apps/api/src/modules/tutors/tutors.schemas.ts` — `addressComplement: z.string().trim().optional()` added to `createTutorSchema` and `updateTutorSchema`.
- `apps/api/src/modules/tutors/tutors.controller.ts` — pass the new field through on create/update (no existence or format validation needed, unlike `region`/`comuna`).
- `apps/mobile/src/types/patient.ts` — `Tutor` and `CreateTutorInput` gain `addressComplement?: string | null` / `addressComplement?: string`.
- `apps/mobile/src/features/patients/registration.types.ts` — `TutorForm.addressComplement: string`, `initialTutorForm`, `toTutorFormState`.
- `apps/mobile/src/features/patients/components/TutorForm.tsx` — new optional text input, below "Calle y número".
- `apps/mobile/app/(drawer)/(tabs)/tutors/create.tsx` and `.../tutors/edit.tsx` — include `addressComplement` in the submitted payload, empty string sent as `undefined` (same convention already used for `email`).
- `apps/mobile/app/(drawer)/(tabs)/tutors/[id].tsx` and `.../patients/[id].tsx` — one new conditional display line.
- `apps/mobile/src/features/patients/tutor-address.ts` — **not modified**. `formatTutorAddress()` and `buildTutorMapsUrl()` keep their current signature and output.
- `apps/api/src/test/tutor-patient.api.test.ts` — extend tutor create/update coverage for the new optional field.
