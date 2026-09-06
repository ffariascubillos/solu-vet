## 1. Remove the screen and its drawer entry

- [x] 1.1 Delete `apps/mobile/app/(drawer)/settings.tsx`.
- [x] 1.2 In `apps/mobile/app/(drawer)/_layout.tsx`, remove the `<Drawer.Screen name="settings" .../>` block, leaving only the `(tabs)` screen. Verify by running the app and confirming the drawer shows only "Inicio", with no "Configuración" entry, and that "Ayuda" is unaffected as a tab inside `(tabs)`.

## 2. Verify

- [x] 2.1 Run `npm exec -w apps/mobile -- tsc --noEmit` and `npm run lint -w apps/mobile`; both must pass.

## 3. Documentation

- [x] 3.1 In `TASKS.md`, remove the "Fix `settings.tsx`" item and the "verify the Patient/Tutor detail tablet layout on a physical Android tablet" item (confirmed done by the user outside this change).
