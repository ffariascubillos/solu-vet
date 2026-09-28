# Proposal

## Why

Manual testing of `add-auth-multitenancy` (see `checklist-tarea-add-auth-multitenancy.md`, "Observaciones para una segunda etapa (fácil)") surfaced six small gaps: leftover placeholder branding and greeting from the original template, two navigation dead-ends in the mobile app, and a species/breed catalog that does not use the names Chilean veterinarians write in a clinical record. They are cheap to fix now and visible on every session.

## What Changes

- Drawer header title shows "SoluVet" instead of the template name "HuellaVet".
- Home screen greets the signed-in user by name ("¡Hola, <nombre>!") from the real session instead of the hardcoded "¡Buen día! Dra. Leslie".
- Tapping "Inicio" in the drawer always navigates to the Home tab, even when the user is on another tab screen (today it only closes the drawer because the tabs navigator is already the focused drawer route).
- Patient detail screen gets a "Ver tutor" action in the Tutor card that opens that tutor's detail screen.
- Species catalog renamed to Chilean clinical names: "Perro" → "Canino", "Gato" → "Felino". Existing rows are renamed in place (same ids), so existing patients keep their species. **BREAKING** for anything that looks species up by the literal name "Perro"/"Gato" (only the API integration tests do).
- New species added for pets commonly seen in Chilean small-animal and exotics practice: Lagomorfo (conejo), Erizo de tierra, Hurón, Cobayo, Hámster, Chinchilla, Ave, Reptil — each with a short breed/type list so a patient can always be registered.
- Breed catalog updates: the cat breed "Mestizo / Sin raza definida" is renamed in place to "Doméstico de pelo corto"; "Doméstico de pelo largo" and a few breeds common in Chile are added for Canino and Felino.

## Capabilities

### New Capabilities
- `mobile-app-shell`: app-level branding, Home greeting, and the navigation paths between Home, drawer, patient detail and tutor detail.
- `species-catalog`: the reference list of species and breeds offered when registering or editing a patient, and how catalog renames preserve existing patients.

### Modified Capabilities
- None. (`mobile-detail-tablet-layout` is untouched: the new "Ver tutor" button lives inside the existing Tutor card and does not change card arrangement.)

## Impact

- `apps/mobile/app/(drawer)/_layout.tsx` — title, drawer item press listener.
- `apps/mobile/app/(drawer)/(tabs)/index.tsx` — greeting from `useAuth()`.
- `apps/mobile/app/(drawer)/(tabs)/patients/[id].tsx` — "Ver tutor" button.
- `apps/api/src/modules/species/species-catalog.seed-data.ts` — new catalog contents.
- New data-only Prisma migration under `apps/api/prisma/migrations/` that renames existing species/breed rows. No schema change, no new endpoints; `GET /api/species` and `GET /api/breeds` return the new names.
- `apps/api/src/test/tutor-patient.api.test.ts`, `consultations.api.test.ts` — literal species names.
- After deploying to an existing database: `prisma migrate deploy` then `npm run prisma:seed -w apps/api` to add the new entries.
