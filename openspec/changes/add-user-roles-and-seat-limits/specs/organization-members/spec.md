# Spec Delta

## Purpose

Caps how many people an Organization can hold (active users plus pending invitations) and gives the OWNER the tools to see and free those seats, so a future subscription plan can change the cap in one place.

## ADDED Requirements

### Requirement: Clinics have a seat limit
The system SHALL limit a `CLINIC` organization to 5 seats: the OWNER plus 4 more. An active `User` and a pending invitation (not accepted, not cancelled, not expired) each take one seat; an expired or cancelled invitation takes none. The limit per organization type SHALL be defined in a single backend setting. The backend SHALL enforce the limit even when requests do not come from the app, including when two invitations are sent at the same time.

#### Scenario: Invitation within the limit
- **WHEN** a clinic OWNER invites someone while the clinic has 1 active user and 2 pending invitations
- **THEN** the system accepts the invitation

#### Scenario: Invitation at the limit
- **WHEN** a clinic OWNER invites someone while the clinic has 3 active users and 2 pending invitations
- **THEN** the system rejects it as a conflict with the message "La clínica alcanzó el límite de 5 usuarios." and creates no invitation

#### Scenario: Expired invitation frees its seat
- **WHEN** a clinic has 4 active users and 1 invitation that has expired, and the OWNER invites someone
- **THEN** the system accepts the invitation

#### Scenario: Concurrent invitations cannot exceed the limit
- **WHEN** a clinic with 4 seats taken receives two invitation requests at the same time
- **THEN** exactly one is accepted and the other is rejected with the limit message

### Requirement: Owner can list the organization's seats
The system SHALL let the OWNER retrieve the seat limit and every taken seat of their own organization. Each seat SHALL include its id, kind (user or invitation), name (users only, may be empty), email, role and status (`ACTIVE` for users, `PENDING` for pending invitations). The OWNER's own seat SHALL be included. Expired, cancelled and accepted invitations SHALL NOT be listed.

#### Scenario: Owner lists seats
- **WHEN** the OWNER of a clinic with 2 active users and 1 pending invitation requests the seat list
- **THEN** the response contains the limit 5 and 3 seats: 2 with status `ACTIVE` and 1 with status `PENDING`

#### Scenario: Seats of another organization are never listed
- **WHEN** the OWNER requests the seat list
- **THEN** no user or invitation from another organization appears

### Requirement: Owner can cancel a pending invitation
The system SHALL let the OWNER cancel a pending invitation of their own organization. A cancelled invitation SHALL free its seat immediately and its activation link SHALL stop working. Cancelling an invitation that does not exist, belongs to another organization or is no longer pending SHALL fail as not found.

#### Scenario: Owner cancels a pending invitation
- **WHEN** the OWNER cancels a pending invitation of their clinic
- **THEN** the invitation no longer appears in the seat list, the seat count drops by one, and its activation link is rejected

#### Scenario: Owner tries to cancel another organization's invitation
- **WHEN** the OWNER cancels an invitation id that belongs to another organization
- **THEN** the system responds not found and the invitation is unchanged

### Requirement: Owner can remove a member
The system SHALL let the OWNER permanently remove a `User` of their own organization other than themselves. Removal SHALL delete the account and end all its sessions immediately, including access tokens already issued. The freed seat and the email SHALL become available immediately. Removing a user that does not exist or belongs to another organization SHALL fail as not found.

#### Scenario: Owner removes a staff member
- **WHEN** the OWNER removes a `VETERINARIAN` of their clinic
- **THEN** that user's next request with their current access token is rejected, they can no longer log in or refresh a session, they no longer appear in the seat list, and their email can be invited again

#### Scenario: Owner tries to remove a user of another organization
- **WHEN** the OWNER removes a user id that belongs to another organization
- **THEN** the system responds not found and that user is unchanged

### Requirement: Clinic owner manages seats from Cuenta
For the OWNER of a `CLINIC`, the mobile Cuenta screen SHALL show a "Usuarios de la clínica" section with the count of seats taken over the limit and one row per seat showing the name (or the email when there is no name), the cargo in Spanish, and the status "Activo" or "Invitación pendiente". Rows other than the OWNER's own SHALL offer "Cancelar invitación" (pending) or "Dar de baja" (active), each asking for confirmation first. While seats remain, the section SHALL show "Invitar usuario"; when the limit is reached, the button SHALL be replaced by the message "La clínica alcanzó el límite de 5 usuarios (tú + 4 invitados)." using the limit returned by the API. Users who are not the OWNER of a CLINIC SHALL NOT see this section.

#### Scenario: Owner with free seats
- **WHEN** a clinic OWNER with 3 of 5 seats taken opens Cuenta
- **THEN** the section shows "3 de 5", three seat rows and the "Invitar usuario" button

#### Scenario: Owner at the limit
- **WHEN** a clinic OWNER with 5 of 5 seats taken opens Cuenta
- **THEN** the "Invitar usuario" button is not shown and the limit message is shown above the seat rows

#### Scenario: Owner cancels an invitation from Cuenta
- **WHEN** the OWNER taps "Cancelar invitación" on a pending row and confirms
- **THEN** the row disappears and the seat count drops by one

#### Scenario: Owner at the limit opens the invite screen by URL
- **WHEN** a clinic OWNER with all seats taken navigates directly to `cuenta/invitar`
- **THEN** the app redirects to Cuenta without showing the invite form

#### Scenario: Staff user opens Cuenta
- **WHEN** a `RECEPTIONIST` opens Cuenta
- **THEN** no seat section and no "Invitar usuario" button are shown
