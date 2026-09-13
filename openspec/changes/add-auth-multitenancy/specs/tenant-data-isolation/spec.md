## Purpose

Guarantees that a user from one Organization can never read, modify, or delete another Organization's data, under any circumstance, applied consistently across Tutor, Patient, Consultation and their related records.

## ADDED Requirements

### Requirement: Organization is derived only from the authenticated session
The system SHALL determine the acting `organizationId` for every request exclusively from the authenticated user's session (the access token). The system SHALL NOT accept an `organizationId` supplied in a request body, query string, path parameter, or header as authoritative for any read, write, update or delete operation.

#### Scenario: Client-supplied organization id is ignored
- **WHEN** an authenticated request includes an `organizationId` in its body or query string that differs from the authenticated user's own organization
- **THEN** the system uses the authenticated user's organization for the operation and does not use the client-supplied value

### Requirement: List and search results are scoped to the caller's organization
The system SHALL restrict every list and search operation on Tutor, Patient and Consultation to records belonging to the authenticated user's organization.

#### Scenario: Listing tutors returns only the caller's organization
- **WHEN** an authenticated user requests the list of tutors
- **THEN** the response contains only tutors belonging to that user's organization

#### Scenario: Searching patients returns only the caller's organization
- **WHEN** an authenticated user searches patients by name
- **THEN** the response contains only patients belonging to that user's organization, even if a match exists in another organization

### Requirement: Access to a single record by id is scoped to the caller's organization
The system SHALL treat a Tutor, Patient, Consultation, or a record nested under a Consultation (home treatment, follow-up, consultation detail, vaccine record, attachment) that does not belong to the authenticated user's organization as not found, for read, update and delete operations alike. The system SHALL respond identically whether the id does not exist at all or belongs to another organization, so a caller cannot distinguish "not found" from "exists in another organization."

#### Scenario: Reading another organization's tutor by id
- **WHEN** an authenticated user requests a tutor by id that belongs to a different organization
- **THEN** the system responds as if no tutor with that id exists

#### Scenario: Updating another organization's patient
- **WHEN** an authenticated user submits an update for a patient id that belongs to a different organization
- **THEN** the system rejects the update as not found and does not modify the record

#### Scenario: Deleting another organization's consultation
- **WHEN** an authenticated user requests deletion of a consultation id that belongs to a different organization
- **THEN** the system rejects the deletion as not found and does not delete the record or its attachments

#### Scenario: Reading consultations by patient id across organizations
- **WHEN** an authenticated user requests the consultation history for a patient id that belongs to a different organization
- **THEN** the system responds as if no patient with that id exists

### Requirement: Related-record writes validate organization ownership
The system SHALL, before creating or updating any record that references another record by id (a Patient referencing a Tutor, a Consultation referencing a Patient, an Attachment referencing a Consultation), verify that the referenced record belongs to the authenticated user's organization, and SHALL reject the operation if it does not.

#### Scenario: Creating a patient under another organization's tutor
- **WHEN** an authenticated user submits a new patient referencing a `tutorId` that belongs to a different organization
- **THEN** the system rejects the request as not found and does not create the patient

#### Scenario: Creating a consultation for another organization's patient
- **WHEN** an authenticated user submits a new consultation referencing a `patientId` that belongs to a different organization
- **THEN** the system rejects the request as not found and does not create the consultation

#### Scenario: Uploading an attachment to another organization's consultation
- **WHEN** an authenticated user uploads a file to a consultation id that belongs to a different organization
- **THEN** the system rejects the upload as not found and does not store the file or create an attachment record

### Requirement: Tutor identifiers are unique per organization, not globally
The system SHALL enforce uniqueness of a Tutor's RUT and email within its own organization only. The same RUT or email MAY exist on tutors belonging to different organizations.

#### Scenario: Same RUT in two different organizations
- **WHEN** two different organizations each register a tutor with the same RUT
- **THEN** both registrations succeed

#### Scenario: Duplicate RUT within the same organization
- **WHEN** an organization registers a second tutor with a RUT already used by another tutor in that same organization
- **THEN** the system rejects the request identifying the RUT field as the conflict

### Requirement: Global reference catalogs remain unscoped
The system SHALL keep Species, Breed and Region as shared catalogs available to every organization, unaffected by organization-based filtering.

#### Scenario: Two organizations see the same species catalog
- **WHEN** users from two different organizations each request the species catalog
- **THEN** both receive the same list, unfiltered by organization
