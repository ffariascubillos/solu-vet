# user-roles Specification

## Purpose

Defines the roles a user can hold inside an Organization, guarantees a single OWNER per organization, and states which actions are reserved to that OWNER.

## Requirements

### Requirement: Users hold one of a fixed set of roles
The system SHALL give every `User` exactly one role from `OWNER`, `VETERINARIAN`, `RECEPTIONIST` or `ASSISTANT`. The user who registers an organization is its `OWNER`; every other user gets the staff role chosen in their invitation.

#### Scenario: Registering user is the owner
- **WHEN** a person registers an independent practice or a clinic
- **THEN** their `User` has role `OWNER`

#### Scenario: Invited user gets the invited role
- **WHEN** a person invited as `ASSISTANT` activates their account
- **THEN** their `User` has role `ASSISTANT` and the session they log in with carries that role

### Requirement: Each organization has exactly one owner
The system SHALL NOT create a second `OWNER` in an `Organization` through any user-facing flow, and SHALL NOT let the OWNER remove themselves.

#### Scenario: Owner cannot be invited
- **WHEN** an invitation with role `OWNER` is submitted
- **THEN** the system rejects it

#### Scenario: Owner cannot remove themselves
- **WHEN** the `OWNER` asks to remove their own user
- **THEN** the system rejects the request and the user remains

### Requirement: Member management is reserved to the owner
The system SHALL allow only the `OWNER` to invite users, list the organization's seats, cancel invitations and remove members. Staff roles SHALL keep the same access as the OWNER to every other feature; finer per-role permissions are out of scope.

#### Scenario: Staff user tries to manage members
- **WHEN** a `VETERINARIAN`, `RECEPTIONIST` or `ASSISTANT` calls the invite, seat listing, cancel invitation or remove member endpoints
- **THEN** the system rejects the request as forbidden

#### Scenario: Staff user uses clinical features
- **WHEN** a `RECEPTIONIST` registers a tutor
- **THEN** the system accepts it exactly as it would for the OWNER

### Requirement: Roles are shown in Spanish
The mobile app SHALL display roles with Spanish labels and SHALL NOT show raw role values: `OWNER` → "Propietario", `VETERINARIAN` → "Médico veterinario", `RECEPTIONIST` → "Recepcionista", `ASSISTANT` → "Asistente / TENS veterinario".

#### Scenario: Staff user sees their role in Cuenta
- **WHEN** a user with role `VETERINARIAN` opens Cuenta
- **THEN** the Rol field shows "Médico veterinario"
