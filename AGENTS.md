# AGENTS.md

## Project

Veterinary Practice Management System MVP.

The product must support:
- Veterinary clinics
- Veterinary hospitals
- Home-visit veterinarians
- Mixed clinic and home-visit workflows

Keep the domain generic. Do not assume every consultation happens at the patient's home.

Current product target:
- Functional MVP first
- Android phones and tablets first
- Responsive web support where Expo provides it
- No Play Store deployment work yet

## Stack

### Frontend
- React Native
- Expo
- TypeScript
- Expo Router
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Zod

### Database
- PostgreSQL

### ORM
- Prisma 7
- `@prisma/adapter-pg`
- Generated Prisma client in `apps/api/src/generated/prisma`

## Architecture

Monorepo:

```txt
solu-vet/
|-- AGENTS.md
|-- PROJECT_STATUS.md
|-- ROADMAP.md
|-- TASKS.md
|-- apps/
|   |-- api/
|   `-- mobile/
`-- packages/
    `-- types/
```

Current application boundaries:
- `apps/api`: Express API, Prisma schema, migrations, uploaded files, and backend modules.
- `apps/mobile`: Expo Router mobile app and mobile API service code.
- `packages/types`: Reserved workspace package; currently no shared source files.

## Language Rules

Backend and internal contracts:
- English only for Prisma models, database tables, columns, API routes, TypeScript types, variables, functions, services, and internal documentation.

Frontend UI:
- Spanish only for veterinarian-facing text.
- Backend enum values and API field names remain English.
- Map backend values to Spanish labels in the presentation layer.

Examples:
- `Patient`, `Tutor`, `Consultation`
- `createPatient()`, `searchPatients()`
- `consultationReason`, `diagnosis`
- `Buscar paciente`, `Registrar paciente`, `Tutor`, `Paciente`

## Prisma Rules

Do not:
- Replace the Prisma architecture.
- Change `apps/api/prisma.config.ts` without a specific reason.
- Switch the Prisma client generation strategy without approval.
- Refactor the schema unnecessarily.

Before Prisma-related edits, inspect:
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma.config.ts`
- `apps/api/src/lib/prisma.ts`

## Frontend Rules

Target:
- Mobile first
- Android phones and tablets
- Responsive web when practical

Avoid:
- Desktop-first layouts
- Home-visit-only assumptions
- Premature optimization
- Unnecessary libraries
- Exposing raw backend enum values directly in UI

## Codex Workflow

Before editing:

1. Read `AGENTS.md`
2. Read `PROJECT_STATUS.md`
3. Read `ROADMAP.md`
4. Read `TASKS.md`
5. Inspect related files
6. Explain findings
7. Create a brief plan
8. Implement small, scoped changes
9. Verify the result when possible

Never:
- Rewrite working modules without justification.
- Rename database entities without approval.
- Change architecture without justification.
- Modify application code when the user asks for documentation-only work.

## Domain

Main entities currently modeled:
- User
- Tutor
- Patient
- Consultation
- HomeTreatment
- FollowUp
- ConsultationDetail
- VaccineRecord
- Attachment

Consultations are location-agnostic. Location tracking may be added later, but current code should work for clinic, hospital, mobile, and mixed workflows.
