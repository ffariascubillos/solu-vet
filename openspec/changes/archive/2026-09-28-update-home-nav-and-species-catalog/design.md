# Design

## Context

Six small follow-ups from the manual test pass of `add-auth-multitenancy`. Four are mobile-only UI/navigation fixes; two change the species/breed reference catalog, which is shared by all organizations and already referenced by `Patient.speciesId` / `Patient.breedId` (FK, `ON DELETE RESTRICT`).

Observed today:
- `apps/mobile/app/(drawer)/_layout.tsx` has a single `Drawer.Screen name="(tabs)"` with `title: 'HuellaVet'`. React Navigation's default `drawerItemPress` behavior is "focus the screen, or close the drawer if it is already focused". `(tabs)` is always the focused drawer route, so "Inicio" only closes the drawer and the inner tab stays where it was.
- `apps/mobile/app/(drawer)/(tabs)/index.tsx` hardcodes "¡Buen día!" / "Dra. Leslie". `useAuth()` (`src/features/auth/hooks/useAuth.tsx`) already exposes `user.name`.
- `patients/[id].tsx` has the full `patient.tutor` (with `id`) but no way to reach `tutors/[id]`.
- `seedCatalog` upserts by `name` with `update: {}`. Changing a name in `SPECIES_SEED_DATA` alone would create a new species and leave the old one (and its patients) behind.

## Goals / Non-Goals

**Goals:** fix the six items with the least code; rename catalog entries without orphaning existing patients; keep dev, test and any existing database convergent.

**Non-Goals:** species/breed admin CRUD (already queued in `TASKS.md`); the Home avatar image and the "Citas para hoy" mock card (avatar work is in the "difícil" list); translating or restructuring any other screen; per-organization catalogs.

## Decisions

### D1. Drawer "Inicio" uses a `drawerItemPress` listener on the `(tabs)` screen
Add `listeners={{ drawerItemPress: () => router.navigate('/') }}` to `Drawer.Screen name="(tabs)"`, without `preventDefault()`. The default action still closes the drawer; our navigate switches the inner tab to `index`. `/` is the route the Home tab icon points to.
- *Alternative:* a custom drawer item replacing `DrawerItemList`. More code for the same result.

### D2. Home greeting reads `useAuth().user?.name`
`user?.name?.trim()` ? `¡Hola, ${name}!` : `¡Hola!`. Replace the two-line header (greeting + green name) with a single `headlineSmall` line; drop the unused green inline style. Avatar stays as is (out of scope).

### D3. "Ver tutor" is a `Button mode="outlined" icon="account"` in the Tutor card header
Mirror the existing "Editar" pattern in the "Datos del paciente" card: wrap "Tutor" title + button in `styles.sectionHeader`, `onPress={() => router.push(\`/tutors/${patient.tutor.id}\` as Href)}`. Keeps the tablet two-card layout untouched.

### D4. Catalog renames happen in a data-only Prisma migration; additions stay in the seed
Create `apps/api/prisma/migrations/<timestamp>_rename_species_catalog_to_chilean_names/migration.sql` via `prisma migrate dev --create-only` (no schema diff), containing only:

```sql
UPDATE "Species" SET "name" = 'Canino', "updatedAt" = NOW() WHERE "name" = 'Perro';
UPDATE "Species" SET "name" = 'Felino', "updatedAt" = NOW() WHERE "name" = 'Gato';
UPDATE "Breed" SET "name" = 'Doméstico de pelo corto', "updatedAt" = NOW()
  WHERE "name" = 'Mestizo / Sin raza definida'
    AND "speciesId" = (SELECT "id" FROM "Species" WHERE "name" = 'Felino');
```

Then `SPECIES_SEED_DATA` is rewritten with the new names and additions. Ordering works on every database:
- Existing DB (dev with patients): migration renames rows in place (ids kept → patients follow); re-running the seed upserts the new names as no-ops and inserts the additions.
- Fresh DB / `solu_vet_test`: migration's `UPDATE`s match nothing; `seedCatalog` (run by `src/test/setup.ts` and `prisma db seed`) creates everything with the new names.

- *Alternative:* rename logic inside `seedCatalog` (map old→new names). Rejected: the seed runs on every test run and would carry one-off migration logic forever. Migrations are the project's existing mechanism for one-time data changes and run exactly once per DB.
- *Alternative:* change `update: {}` to overwrite. Doesn't help — upsert is keyed on the name that is changing.

The dog breed "Mestizo / Sin raza definida" is kept unchanged (still valid for dogs in Chile). The cat breed "Común Europeo" is kept as its own entry: in Chilean practice "Doméstico de pelo corto/largo" is the label for mixed-breed cats (quiltros), not a synonym of a named breed.

### D5. Catalog contents
No official Chilean database of veterinary species/breeds was found. The national pet registry (Ley 21.020) only covers dogs and cats. The list below follows the species Chilean exotics clinics advertise (conejos, erizos de tierra, hurones, cobayos, hámsters, chinchillas, aves, tortugas). It uses the group-level clinical labels a vet writes in a record ("Canino", "Felino", "Lagomorfo"), with the common name where no group label is used in practice.

| Species | Breeds |
|---|---|
| Canino | Labrador Retriever, Golden Retriever, Pastor Alemán, Bulldog Francés, Poodle, Chihuahua, Beagle, Mestizo / Sin raza definida *(existing)* + Fox Terrier Chileno, Schnauzer, Yorkshire Terrier, Shih Tzu, Cocker Spaniel, Dachshund, Border Collie, Husky Siberiano, Pug, Boxer, Rottweiler |
| Felino | Común Europeo, Siamés, Persa, Maine Coon, Angora *(existing)*, Doméstico de pelo corto *(renamed)*, Doméstico de pelo largo, Bengalí, Ragdoll, Británico de pelo corto, Esfinge |
| Lagomorfo | Conejo doméstico / Mestizo, Enano holandés, Belier (Lop), Cabeza de león, Rex |
| Erizo de tierra | Erizo africano pigmeo |
| Hurón | Hurón doméstico |
| Cobayo | Americano (pelo corto), Abisinio, Peruano (pelo largo), Mestizo |
| Hámster | Sirio, Ruso (enano), Roborovski, Chino |
| Reptil | Tortuga de tierra, Tortuga de agua, Otro reptil |
| Ave | Ninfa (Cacatúa ninfa), Canario, Catita australiana, Agapornis, Loro, Loro Tricahue, Loro Choroy, Cachaña, Perico Cordillerano, Otra ave |
| Chinchilla | Chinchilla doméstica |

"Ave" and "Reptil" are coarse on purpose: MVP, and a patient needs *some* breed. The admin CRUD in `TASKS.md` is where finer entries get added later.

## Risks / Trade-offs

- [API tests look species up by "Perro"/"Gato"] → Update the literals in `tutor-patient.api.test.ts` and `consultations.api.test.ts` in the same change (coder, so the suite stays green before handoff).
- [Dev DB not re-seeded after migrating] → Canino/Felino are correct but new species are missing. Mitigation: task explicitly runs `npm run prisma:seed -w apps/api` after migrating dev.
- [`solu_vet_test` must also get the migration] → per CLAUDE.md, apply it there too (it's a no-op there but keeps `_prisma_migrations` in sync).
- [Catalog content is not from an authoritative source] → Felipin reviewed and edited the D5 table (added native Chilean birds to "Ave").

## Resolved Questions

1. Species label for rabbits: "Lagomorfo" (Felipin).
2. "Común Europeo" stays separate from "Doméstico de pelo corto/largo", which in Chile name mixed-breed cats (Felipin).
3. "Ave" and "Reptil" stay in the MVP — tutors do bring in turtles and birds (Felipin).
