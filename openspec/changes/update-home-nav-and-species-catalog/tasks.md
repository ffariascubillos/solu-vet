## 1. Mobile app shell (coder)

- [x] 1.1 In `apps/mobile/app/(drawer)/_layout.tsx`, change the `(tabs)` screen `title` from `'HuellaVet'` to `'SoluVet'`.
- [x] 1.2 In the same file, add `listeners={{ drawerItemPress: () => router.navigate('/') }}` to `Drawer.Screen name="(tabs)"` (import `router` from `expo-router`; do not call `preventDefault`) — design D1.
- [x] 1.3 In `apps/mobile/app/(drawer)/(tabs)/index.tsx`, replace the "¡Buen día!" / "Dra. Leslie" block with a single line `¡Hola, <name>!` from `useAuth().user?.name`, falling back to `¡Hola!` when the name is missing or blank — design D2.
- [x] 1.4 In `apps/mobile/app/(drawer)/(tabs)/patients/[id].tsx`, wrap the Tutor card title in `styles.sectionHeader` with a `Button mode="outlined" icon="account" compact` labeled "Ver tutor" that pushes `/tutors/${patient.tutor.id}` — design D3.

## 2. Species catalog (coder)

- [ ] 2.1 Create a data-only migration with `npm exec -w apps/api -- prisma migrate dev --create-only --name rename_species_catalog_to_chilean_names` and put the three `UPDATE` statements from design D4 in its `migration.sql`.
- [ ] 2.2 Rewrite `SPECIES_SEED_DATA` in `apps/api/src/modules/species/species-catalog.seed-data.ts` with the table in design D5 (keep `seedCatalog` unchanged).
- [ ] 2.3 Apply the migration to the dev DB and to `solu_vet_test`, then run `npm run prisma:seed -w apps/api` on dev.
- [ ] 2.4 Replace the literal `"Perro"` / `"Gato"` lookups in `apps/api/src/test/tutor-patient.api.test.ts` and `apps/api/src/test/consultations.api.test.ts` with `"Canino"` / `"Felino"`.

## 3. Verification (coder, before handoff)

- [ ] 3.1 `npm exec -w apps/api -- tsc --noEmit` and `npm test -w apps/api` pass.
- [ ] 3.2 `npm exec -w apps/mobile -- tsc --noEmit` and `npm run lint -w apps/mobile` pass.

## 4. Tests (tester, after Felipin's positive review)

- [ ] 4.1 API: `GET /api/species` includes all ten D5 species and none of "Perro"/"Gato"; every species returns ≥1 breed from `GET /api/breeds?speciesId=`; Felino breeds include both "Doméstico" entries and not "Mestizo / Sin raza definida".
- [ ] 4.2 API: rename migration SQL preserves ids — insert a species "Perro" + a patient in the test DB, execute the migration's `UPDATE`s, assert the patient's species is "Canino" with the same id.
- [ ] 4.3 Mobile: Home greeting renders `¡Hola, <name>!` and `¡Hola!` for a missing name (mock `useAuth`).
- [ ] 4.4 Mobile: Patient detail "Ver tutor" pushes `/tutors/<tutorId>`.
- [ ] 4.5 Happy-path e2e/manual: drawer "Inicio" from "Registrar tutor" lands on Home.

## 5. Close-out (orchestrator)

- [ ] 5.1 Update `TASKS.md` and today's `DAILY/` log; remove the "fácil" section from `checklist-tarea-add-auth-multitenancy.md` once shipped.
- [ ] 5.2 Commit with the `commit` skill.
