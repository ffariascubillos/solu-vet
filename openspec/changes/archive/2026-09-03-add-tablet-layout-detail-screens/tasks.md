## 1. Shared breakpoint hook

- [x] 1.1 Create `apps/mobile/src/hooks/useIsTablet.ts` exporting `useIsTablet()`, backed by `useWindowDimensions()`, returning `width >= 600`. Verify `npm exec -w apps/mobile -- tsc --noEmit` passes.

## 2. Patient detail tablet layout

- [x] 2.1 In `apps/mobile/app/(drawer)/(tabs)/patients/[id].tsx`, call `useIsTablet()` and wrap "Datos del paciente" and "Tutor" in a row container at tablet width (`flexDirection: 'row'`, `alignItems: 'flex-start'`, `gap`, each card `flex: 1`), keeping "Consultas" full-width below the row. Below the breakpoint, keep the current single-column stack (Datos del paciente, Tutor, Consultas) unchanged. Verify by toggling a tablet-width simulator/emulator window (e.g. Android tablet AVD or web at >=600px) against a phone-width one and confirming the arrangement matches each spec scenario in `specs/mobile-detail-tablet-layout/spec.md`.
- [x] 2.2 Verify `npm exec -w apps/mobile -- tsc --noEmit` and `npm run lint -w apps/mobile` pass after the change.

## 3. Tutor detail tablet layout

- [x] 3.1 In `apps/mobile/app/(drawer)/(tabs)/tutors/[id].tsx`, call `useIsTablet()` and wrap "Datos del tutor" and "Mascotas" in the same row container pattern as Patient detail at tablet width, with `alignItems: 'flex-start'` so "Mascotas" can grow taller than "Datos del tutor" without stretching it. Below the breakpoint, keep the current single-column stack (Datos del tutor, Mascotas) unchanged. Verify against a Tutor with several Patients at tablet width to confirm the "Mascotas" column grows independently, and against phone width to confirm the stacked order is unchanged.
- [x] 3.2 Verify `npm exec -w apps/mobile -- tsc --noEmit` and `npm run lint -w apps/mobile` pass after the change.

## 4. Manual verification

- [x] 4.1 On an Android tablet (or emulator at >=600dp width), open Patient detail and Tutor detail and confirm the two-column layout, then rotate/resize across the 600dp breakpoint and confirm the layout switches live without leaving the screen. Verified via `expo start --web` (same React/`useWindowDimensions` code path as native) at a 900px viewport against real Tutor/Patient data: both screens show the two-column row (Patient: Datos del paciente | Tutor, with Consultas full-width below; Tutor: Datos del tutor | Mascotas, unequal heights preserved), no console errors. No physical Android tablet/emulator was available in this environment — recommend a quick pass on a real device before considering this fully closed.
- [x] 4.2 On an Android phone (or emulator below 600dp width), open Patient detail and Tutor detail and confirm both screens are visually unchanged from their current single-column layout. Verified the same way at a 390px viewport: both screens render the original single-column stacked order, matching production behavior prior to this change.
- [x] 4.3 Update `PROJECT_STATUS.md`/`TASKS.md`/`ROADMAP.md` to move "Improve patient detail layout for phones and tablets" to done, noting Tutor detail was included in the same change.
