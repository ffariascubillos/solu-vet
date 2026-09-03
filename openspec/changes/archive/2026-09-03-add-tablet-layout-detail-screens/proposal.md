## Why

`patients/[id].tsx` and `tutors/[id].tsx` stack every card full-width in a single column regardless of screen size. On a tablet (especially landscape, ~800-1200dp wide), each card stretches across the whole screen for a handful of short text lines, wasting horizontal space and hurting readability — a bad fit for a product whose stated MVP target is "Android phones and tablets first."

## What Changes

- Add a shared `useIsTablet` hook (`useWindowDimensions`, 600dp breakpoint — Android's standard `sw600dp` phone/tablet cutoff) as the app's first responsive-layout primitive.
- On `patients/[id].tsx`, at tablet width show "Datos del paciente" and "Tutor" side by side in a row, with "Consultas" full-width below. Below the breakpoint, keep today's single-column stack unchanged.
- On `tutors/[id].tsx`, at tablet width show "Datos del tutor" and "Mascotas" side by side in a row. Below the breakpoint, keep today's single-column stack unchanged.
- No changes to data fetching, navigation, or the create/edit forms — this is a presentational layout change to the two detail screens only.

## Capabilities

### New Capabilities
- `mobile-detail-tablet-layout`: defines the tablet-width breakpoint and the two-column arrangement of Patient detail and Tutor detail cards.

### Modified Capabilities
- None — no existing capability specs exist yet for these screens; this introduces the first spec covering their layout behavior.

## Impact

- `apps/mobile/src/hooks/useIsTablet.ts` (new shared hook).
- `apps/mobile/app/(drawer)/(tabs)/patients/[id].tsx` (layout only).
- `apps/mobile/app/(drawer)/(tabs)/tutors/[id].tsx` (layout only).
- No API, schema, or navigation changes.
