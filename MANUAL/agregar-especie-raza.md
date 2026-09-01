# Cómo agregar una nueva especie o raza

`Species` (especie) y `Breed` (raza) son catálogos guardados en la base de datos, no una lista fija en el código. Por eso agregar una especie o raza nueva **no requiere una migración de base de datos** — solo agregar un dato nuevo.

Hoy no existe todavía una pantalla en la app para hacer esto (el mantenedor de especies/razas para administradores está pendiente, ver `TASKS.md`). Mientras tanto, hay dos formas de hacerlo.

## Opción 1: por código + seed (recomendada)

Es la forma prolija porque queda registrada en git, junto con el resto del historial del proyecto.

1. Abre el archivo `apps/api/src/modules/species/species-catalog.seed-data.ts`. Tiene esta forma:

   ```ts
   export const SPECIES_SEED_DATA = [
     {
       name: "Perro",
       breeds: [
         "Labrador Retriever",
         "Golden Retriever",
         // ...
         "Mestizo / Sin raza definida",
       ],
     },
     {
       name: "Gato",
       breeds: [
         "Común Europeo",
         // ...
       ],
     },
   ]
   ```

2. **Para agregar una raza nueva a una especie que ya existe** (ej. una raza de perro que falta): agrega el nombre al array `breeds` de esa especie.

3. **Para agregar una especie nueva** (ej. "Conejo"): agrega un objeto nuevo a la lista, con su propio array `breeds`. Recuerda incluir una opción tipo "Mestizo / Sin raza definida" para esa especie, para cubrir el caso de raza desconocida (es obligatorio elegir una raza al registrar un paciente).

4. Guarda el archivo y corre:

   ```bash
   npm run prisma:seed -w apps/api
   ```

   Este comando es seguro de correr las veces que quieras: usa `upsert`, así que no duplica lo que ya existe, solo agrega lo nuevo.

5. Si quieres que el cambio también quede en la base de datos de tests (`solu_vet_test`), corre el mismo comando apuntando a esa base:

   ```bash
   DATABASE_URL="postgresql://postgres:admin@localhost:5432/solu_vet_test?schema=public" npm run prisma:seed -w apps/api
   ```

## Opción 2: por Prisma Studio (rápido, sin tocar código)

Útil para probar algo puntual, pero no queda registrado en el código del proyecto.

1. Corre:

   ```bash
   npm run prisma:studio -w apps/api
   ```

2. Se abre una página web local. Ahí puedes:
   - Insertar una fila nueva en la tabla `Species` (solo necesita `name`).
   - Insertar una fila nueva en la tabla `Breed` (necesita `name` y `speciesId` — el `id` de la especie a la que pertenece, que puedes copiar desde la tabla `Species`).

## A futuro

Está planificado un mantenedor CRUD dentro de la propia app, solo para administradores, para agregar/editar/eliminar especies y razas sin tocar código ni la base de datos directamente. Depende de que exista autenticación con roles, que todavía no está implementada (ver `TASKS.md` y `ROADMAP.md`).
