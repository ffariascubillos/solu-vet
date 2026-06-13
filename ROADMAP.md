# ROADMAP.md

## Phase 1 - MVP Registration And Patient Lookup

### Mobile Registration Flow
- Build tutor + patient registration screen.
- Validate required tutor fields.
- Validate required patient fields.
- Create tutor through the API.
- Create patient with returned `tutorId`.
- Navigate to patient detail after successful creation.
- Show Spanish loading, success, and error states.

### Patient Lookup
- Improve patient search empty state.
- Improve patient search error state.
- Improve patient detail layout for phones and tablets.
- Map backend enum values to Spanish UI labels.
- Keep copy neutral for clinic, hospital, home-visit, and mixed workflows.

### API Completion For Core Records
- Add tutor detail endpoint if needed by mobile flows.
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
