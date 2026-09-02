# ROADMAP.md

## Phase 1 - MVP Registration And Patient Lookup

### Mobile Registration Flow
- Completed: build tutor + patient registration screen.
- Completed: validate required tutor fields.
- Completed: validate required patient fields.
- Completed: create tutor through the API.
- Completed: create patient with returned `tutorId`.
- Completed: finalize Tutor + Patient(s) registration on Tutor detail.
- Completed: allow adding more Patients for a preselected Tutor from Tutor detail.
- Completed: separate Tutor registration into its own mobile screen.
- Completed: make Tutor detail the completion surface after creating a Tutor.
- Completed: make Patient registration start from an existing Tutor only.
- Completed: show Spanish loading and error states.
- Completed: validate the full flow against a live local database from the mobile app.
- Completed: add a registration success state for adding another Patient or finishing.
- Completed: add mobile Editar screens for Tutor and Patient, reached from a new Editar button on each detail screen.

### Patient Lookup
- Completed: separate patient lookup by Patient and Tutor search modes.
- Completed: improve patient search empty state.
- Completed: improve patient search error state and retry behavior.
- Improve patient detail layout for phones and tablets.
- Completed: add Tutor detail screen with related Patients.
- Completed: map backend enum values to Spanish UI labels in patient detail.
- Completed: keep MVP registration/detail/home copy neutral for clinic, hospital, home-visit, and mixed workflows.

### API Completion For Core Records
- Completed: add Tutor search endpoint with related Patients for mobile lookup.
- Completed: add Tutor detail endpoint with related Patients for mobile flows.
- Completed: replace free-text `Patient.species`/`Patient.breed` with `Species`/`Breed` reference tables, seeded catalog, and read-only `/api/species` and `/api/breeds` endpoints.
- Completed: replace free-text `Tutor.address` with `region`/`comuna` selects (static Chile catalog, read-only `/api/regions`) plus a `streetAddress` field, so the Google Maps link always includes comuna, region, and country.
- Completed: add tutor update endpoint.
- Completed: add patient update endpoint.
- Decided not to implement tutor/patient delete endpoints: `onDelete: Cascade` from Tutor/Patient down to Consultation and its clinical records means a hard delete would irreversibly erase medical history, with no auth or confirmation flow yet to guard it. Real deletions are handled manually against the database.
- Return predictable validation and unique-constraint errors.
- Add an admin-only CRUD maintainer for species and breeds (depends on authentication with roles — see Future Platform Features).

## Phase 2 - Clinical Workflow

### Consultations
- Add mobile consultation creation flow.
- Add mobile consultation detail view.
- Add mobile consultation edit flow.
- Show consultation history from patient detail.

### Home Treatment
- Add mobile home-treatment fields to consultation workflows.
- Generate printable or shareable home-treatment instructions.

### Follow Ups
- Add follow-up creation flow.
- Add follow-up history display.
- Add follow-up reminders or scheduling later.

### Vaccinations
- Add vaccine record creation flow.
- Add vaccine history display.
- Add vaccine due-date support later.

### Attachments
- Add mobile attachment upload.
- Add attachment list and preview/open behavior.
- Add attachment delete flow.

## Phase 3 - Professional Outputs

- PDF medical reports.
- Printable medical records.
- Prescription generation.
- Export consultation data.
- Clinic-neutral report templates.

## Phase 4 - Practice Operations

- Appointment scheduling.
- Billing and payments.
- Inventory management.
- Clinic dashboard.
- Multi-branch support.

## Future Platform Features

- Evaluate Google Places Autocomplete (restricted to Chile) for exact-pin address precision on home visits, as a follow-up to the Region/Comuna structured address. Requires a Google Cloud project, billing, an API key proxied through the backend, and a new mobile dependency — deferred until there is budget/infra for it.
- Multi-user accounts.
- Veterinarian profiles.
- Cloud file storage.
- Offline mode.
- Data synchronization.
- Role-based permissions.
- Play Store deployment.
