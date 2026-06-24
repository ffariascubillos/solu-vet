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
- Add tutor update endpoint.
- Add tutor delete endpoint.
- Add patient update endpoint.
- Add patient delete endpoint.
- Return predictable validation and unique-constraint errors.

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

- Multi-user accounts.
- Veterinarian profiles.
- Cloud file storage.
- Offline mode.
- Data synchronization.
- Role-based permissions.
- Play Store deployment.
