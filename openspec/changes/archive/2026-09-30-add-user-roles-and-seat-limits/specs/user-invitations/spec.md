# Spec Delta

## MODIFIED Requirements

### Requirement: Only an OWNER can invite a user
The system SHALL restrict inviting a new user into an `Organization` to users with role `OWNER` in that `Organization`. The invitation SHALL carry one staff role chosen by the OWNER (`VETERINARIAN`, `RECEPTIONIST` or `ASSISTANT`); an invitation with role `OWNER` or with no role SHALL be rejected. Creating an invitation SHALL NOT create a `User`: it creates a pending invitation and sends an activation email.

#### Scenario: Owner invites a user
- **WHEN** a user with role `OWNER` of a `CLINIC` with free seats submits an invitation with an email and the role `RECEPTIONIST`
- **THEN** the system creates a pending invitation for that email and role in the owner's organization, sends an activation email, and no `User` exists yet for that email

#### Scenario: Non-owner attempts to invite
- **WHEN** a user without role `OWNER` submits an invitation request
- **THEN** the system rejects the request

#### Scenario: Owner attempts to invite another owner
- **WHEN** an `OWNER` submits an invitation with role `OWNER`
- **THEN** the system rejects the request as a validation error and creates no invitation

#### Scenario: Pending invitee cannot log in or reset a password
- **WHEN** a person with a pending, not yet activated invitation tries to log in or requests a password reset for that email
- **THEN** login fails with the generic invalid-credentials message and no password reset email is sent

### Requirement: Activation token is single-use and time-limited
The system SHALL reject an activation attempt when the token is unknown, already used, cancelled, or past its expiration. A successful activation SHALL create the `User` from the invitation.

#### Scenario: Successful activation
- **WHEN** an invited person submits a valid, unused, unexpired activation token with a new password
- **THEN** the system creates their `User` account with that password, the invitation's email, role and organization, marks the token used, and the user can now log in

#### Scenario: Expired activation token
- **WHEN** an invited person submits an activation token past its expiration
- **THEN** the system rejects the request and creates no account

#### Scenario: Already-used activation token
- **WHEN** an invited person submits an activation token that was already used to activate the account
- **THEN** the system rejects the request

#### Scenario: Cancelled invitation token
- **WHEN** an invited person submits the activation token of an invitation the OWNER cancelled
- **THEN** the system rejects the request and creates no account

#### Scenario: Email registered while the invitation was pending
- **WHEN** an invited person submits a valid activation token but a `User` with that email was created in the meantime
- **THEN** the system rejects the request with the invalid-link message and creates no second account

### Requirement: Invitation rejects an email already in use
The system SHALL reject an invitation when the submitted email already belongs to an existing `User`, in this organization or any other, or already has a pending, unexpired invitation from any organization. An email whose invitations are all expired, cancelled or accepted-then-removed MAY be invited again.

#### Scenario: Inviting an already-registered email
- **WHEN** an `OWNER` submits an invitation for an email that already belongs to a `User`
- **THEN** the system rejects the request with a message identifying the email field as the conflict

#### Scenario: Inviting an email with a pending invitation
- **WHEN** an `OWNER` submits an invitation for an email that already has a pending, unexpired invitation
- **THEN** the system rejects the request with a message identifying the email field as the conflict

#### Scenario: Re-inviting after the previous invitation expired
- **WHEN** an `OWNER` invites an email whose only invitation has expired
- **THEN** the system accepts the invitation

### Requirement: Invited user is scoped to the inviting organization
The system SHALL bind an invited user to the `Organization` of the `OWNER` who invited them, with the role specified in the invitation, and SHALL NOT let the invited person choose a different organization or role during activation.

#### Scenario: Activated user belongs to the inviter's organization
- **WHEN** an invited person completes activation
- **THEN** their `User` record's organization and role match the invitation the `OWNER` sent, unchanged from when the invitation was created

## ADDED Requirements

### Requirement: Independent organizations cannot invite users
The system SHALL reject any invitation request from a user whose `Organization` has `type = INDEPENDENT`, regardless of the client that sends it. The mobile app SHALL NOT offer the invite action to such users and SHALL send them back to Cuenta if they open the invite screen directly.

#### Scenario: Independent owner calls the invite endpoint directly
- **WHEN** the `OWNER` of an `INDEPENDENT` organization submits an invitation request
- **THEN** the system rejects it as forbidden with the message "Las cuentas de veterinario independiente no pueden invitar usuarios." and creates no invitation

#### Scenario: Independent owner opens Cuenta
- **WHEN** the `OWNER` of an `INDEPENDENT` organization opens Cuenta
- **THEN** no "Invitar usuario" button is shown

#### Scenario: Independent owner opens the invite screen by URL
- **WHEN** the `OWNER` of an `INDEPENDENT` organization navigates directly to `cuenta/invitar`
- **THEN** the app redirects to Cuenta without showing the invite form

### Requirement: Invite screen requires choosing a cargo
The mobile invite screen SHALL show a cargo selector with the staff roles labelled in Spanish ("Médico veterinario", "Recepcionista", "Asistente / TENS veterinario"), with none preselected, and SHALL NOT submit until one is chosen.

#### Scenario: Submitting without a cargo
- **WHEN** the OWNER enters a valid email but chooses no cargo and taps "Enviar invitación"
- **THEN** the app shows "Selecciona un cargo." and sends no request

#### Scenario: Submitting with a cargo
- **WHEN** the OWNER enters a valid email, chooses "Recepcionista" and taps "Enviar invitación"
- **THEN** the app sends the invitation with role `RECEPTIONIST` and shows the success message
