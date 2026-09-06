# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sistema de gestión de práctica veterinaria (MVP). Debe soportar clínicas veterinarias, hospitales veterinarios, veterinarios a domicilio y flujos mixtos. Mantén el dominio genérico: no asumas que toda consulta ocurre en el domicilio del paciente.

Objetivo actual: MVP funcional, Android (teléfonos y tablets) primero, soporte web responsive donde Expo lo permita, sin trabajo de despliegue a Play Store todavía.

Documentos del proyecto y cuándo leerlos:

- `TASKS.md` — siempre. Es la cola de trabajo activa.
- `ROADMAP.md` — cuando la tarea toque el alcance del producto o cierre un ítem de fase.
- `PROJECT_STATUS.md` — cuando necesites el estado de un endpoint o el porqué de una decisión previa. No lo leas entero por costumbre.
- `DAILY/` — solo para reconstruir el contexto de una sesión anterior.
- `MANUAL/` — guías operativas para el usuario final, no reglas para ti.

## Flujo de trabajo

El agente principal actúa como orquestador y arquitecto: crea el plan, lo revisa con el usuario (Felipin), y delega la implementación al subagente **`coder`** y el testing al subagente **`tester`** — no implementa código directamente salvo que Felipin pida explícitamente una tarea puntual y acotada sin pasar por el ciclo completo.

Antes de iniciar una tarea de desarrollo, lee `workflow.md` — ahí está el ciclo completo (roles, pasos, bifurcaciones de feedback) y el diagrama del flujo. Es la única fuente del proceso; no lo repitas aquí.

## Stack

- **Mobile**: React Native + Expo + Expo Router + TypeScript + Axios, con `react-native-paper` para componentes de UI.
- **API**: Node.js + Express + TypeScript + Zod.
- **Base de datos**: PostgreSQL vía Prisma 7 y `@prisma/adapter-pg`, con el cliente generado en `apps/api/src/generated/prisma`.

## Comandos

Monorepo npm workspaces (`apps/*`, `packages/*`).

```bash
# API (desde la raíz)
npm run dev:api                              # levanta la API con tsx watch
npm exec -w apps/api -- tsc --noEmit         # chequeo de tipos
npm test -w apps/api                          # vitest run (tests de integración)
npm exec -w apps/api -- vitest run <archivo>  # correr un solo archivo de test
npm run prisma:generate -w apps/api           # regenerar Prisma client
npm run prisma:migrate -w apps/api            # crear/aplicar migración en dev
npm run prisma:studio -w apps/api

# Mobile (Expo)
cd apps/mobile && npx expo start
npm exec -w apps/mobile -- tsc --noEmit
npm run lint -w apps/mobile
```

Los tests de la API requieren `DATABASE_URL` en `apps/api/.env`; `src/test/setup.ts` reescribe el nombre de la base a `solu_vet_test` automáticamente, así que la migración debe estar aplicada también en esa base (no en la de desarrollo).

## Arquitectura

```
apps/
  api/      Express + TypeScript + Prisma 7, esquema, migraciones, uploads
  mobile/   Expo Router + React Native
packages/
  types/    Workspace reservado, sin código compartido todavía
```

### Backend (`apps/api`)

- Módulos por dominio en `src/modules/<entidad>/`, cada uno con tres archivos: `*.controller.ts` (handlers), `*.routes.ts` (Router), `*.schemas.ts` (Zod). `src/routes/index.ts` monta cada router bajo `/api/<entidad>` y expone `/api/health`.
- `src/app.ts` configura Express (cors, json, estáticos de `/uploads`, router, `errorHandler`). `src/server.ts` solo hace `.listen()`.
- `src/lib/prisma.ts` crea el `PrismaClient` único vía `@prisma/adapter-pg`. El cliente generado vive en `src/generated/prisma` (no lo edites a mano).
- `src/middlewares/error-handler.ts` es el manejador central de errores: convierte `ZodError` → 400, `Prisma P2002` (unique constraint) → 409 con `{ ok, message, field }`, `MulterError` → 400, resto → 500. Los controladores individuales también hacen chequeos `findUnique` explícitos antes de crear (ver `createTutor`) porque los metadatos de `P2002` no siempre identifican el campo con confiabilidad; el handler central queda como respaldo para escrituras concurrentes.
- Forma de respuesta consistente en todo el API: `{ ok: boolean, data?: ..., message?: string, field?: string, errors?: ... }`.
- Reglas de Prisma: no reemplazar la arquitectura de Prisma, no tocar `prisma.config.ts` sin motivo concreto, no cambiar la estrategia de generación del cliente ni refactorizar el schema sin necesidad. Antes de tocar algo relacionado con Prisma, revisa `prisma/schema.prisma`, `prisma.config.ts` y `src/lib/prisma.ts`.
- Entidades del dominio: `User`, `Tutor`, `Patient`, `Consultation`, `HomeTreatment`, `FollowUp`, `ConsultationDetail`, `VaccineRecord`, `Attachment`. Las consultas son agnósticas de ubicación (clínica, hospital, domicilio o mixto); no agregues lógica que asuma una sola modalidad.
- Flujo actual: Tutor y Patient se crean por separado (no hay endpoint combinado ni transacción). Se crea primero el Tutor, se usa el `tutor.id` devuelto para crear el Patient con `tutorId`. Un Tutor sin Patients es un registro MVP válido.

### Mobile (`apps/mobile`)

- Rutas con Expo Router en `app/(drawer)/(tabs)/...`; lógica de features en `src/features/<entidad>/` (componentes, servicio, tipos, validación).
- `src/services/api.ts` crea el cliente Axios; la `baseURL` viene de `EXPO_PUBLIC_API_URL`, definida en `apps/mobile/.env` (no versionado — `apps/mobile/.env.example` documenta los formatos para LAN, emulador Android y web/localhost). Si la variable falta, el módulo lanza un error explícito al arrancar en vez de apuntar silenciosamente a la red equivocada.
- El registro de Tutor y Patient son pantallas separadas: se registra el Tutor primero y termina en el detalle del Tutor; agregar un Patient se hace desde el detalle del Tutor reutilizando la pantalla de registro con el Tutor preseleccionado (`patients/create?tutorId=...`).

## Reglas de idioma

- Backend y contratos internos: solo inglés — modelos Prisma, tablas, columnas, rutas de API, tipos TypeScript, variables, funciones, servicios y documentación interna. Ejemplos: `Patient`, `Tutor`, `createPatient()`, `consultationReason`.
- UI frontend: solo español para todo texto de cara al veterinario/usuario. Los valores de enum del backend y los nombres de campos de la API se mantienen en inglés — mapea esos valores a etiquetas en español en la capa de presentación (nunca expongas `MALE`, `STERILIZED`, etc. directo en la UI).

## Reglas de frontend

Evita: layouts pensados para desktop primero, asumir que todo es a domicilio, optimización prematura, librerías innecesarias.

## Documentación

git ya registra **qué** cambió, con fecha y diff. Estos archivos registran **por qué**, y solo eso.

- `TASKS.md` — se actualiza siempre. Un ítem terminado se borra, no se archiva: ya quedó en el historial de git.
- `PROJECT_STATUS.md` — solo cuando cambia una capacidad del sistema (endpoint nuevo, cambio de modelo) o se toma una decisión de arquitectura. Registra decisiones con su justificación, nunca actividad.
- `ROADMAP.md` — solo al cerrar un ítem de fase o cambiar el alcance del producto.
- `DAILY/DAILY_LOG_YYYY-MM-DD.md` — uno por sesión de trabajo, no por feature.

Para un cambio pequeño (un bug de UI, una corrección de copy) basta una línea en `TASKS.md` y una en el `DAILY_LOG`; no toques `PROJECT_STATUS.md` ni `ROADMAP.md`.

Si el trabajo pasa por OpenSpec, su justificación va en `openspec/changes/<id>/design.md`, **no** en `PROJECT_STATUS.md`. Y cuando exista un `openspec/specs/<capability>/spec.md` que cubra una capacidad, borra la sección equivalente de `PROJECT_STATUS.md`: los specs de OpenSpec son la fuente de verdad y `PROJECT_STATUS.md` debe encogerse a medida que crecen.

No dupliques el mismo hecho en varios archivos. Cada dato vive en un solo lugar, o las copias se desincronizan y terminan contradiciéndose entre sí.

## Al trabajar en este repo

- No reescribas módulos que funcionan sin justificación, no renombres entidades de base de datos sin aprobación, no cambies arquitectura sin justificación.
- Si el usuario pide trabajo solo de documentación, no modifiques código de aplicación.
- Cambios pequeños y acotados; verifica con los comandos de tipos/tests/lint correspondientes cuando sea posible.
