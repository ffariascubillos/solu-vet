## Purpose

Lets an Organization's OWNER add veterinarians and reception staff without ever transmitting a plaintext password, by emailing a single-use activation link that the invited person uses to set their own password.

## ADDED Requirements

### Requirement: Only an OWNER can invite a user
The system SHALL restrict inviting a new user into an `Organization` to users with role `OWNER` in that `Organization`.

#### Scenario: Owner invites a user
- **WHEN** a user with role `OWNER` submits an invitation with an email and a role for their own organization
- **THEN** the system creates a pending `User` in that organization and sends an activation email

#### Scenario: Non-owner attempts to invite
- **WHEN** a user without role `OWNER` submits an invitation request
- **THEN** the system rejects the request

### Requirement: Invitation never transmits a plaintext password
The system SHALL NOT generate or email a plaintext password for an invited user. Instead it SHALL email a link containing a single-use activation token that lets the invited person choose their own password.

#### Scenario: Invitation email contains an activation link, not a password
- **WHEN** an invitation is created
- **THEN** the email sent to the invited address contains an activation link and no password

### Requirement: Activation token is single-use and time-limited
The system SHALL reject an activation attempt when the token is unknown, already used, or past its expiration.

#### Scenario: Successful activation
- **WHEN** an invited person submits a valid, unused, unexpired activation token with a new password
- **THEN** the system sets that password on their `User` account, marks the token used, and the user can now log in

#### Scenario: Expired activation token
- **WHEN** an invited person submits an activation token past its expiration
- **THEN** the system rejects the request and does not activate the account

#### Scenario: Already-used activation token
- **WHEN** an invited person submits an activation token that was already used to activate the account
- **THEN** the system rejects the request

### Requirement: Invitation rejects an email already in use
The system SHALL reject an invitation when the submitted email already belongs to an existing `User`, in this organization or any other.

#### Scenario: Inviting an already-registered email
- **WHEN** an `OWNER` submits an invitation for an email that already belongs to a `User`
- **THEN** the system rejects the request with a message identifying the email field as the conflict

### Requirement: Invited user is scoped to the inviting organization
The system SHALL bind an invited user to the `Organization` of the `OWNER` who invited them, with the role specified in the invitation, and SHALL NOT let the invited person choose a different organization during activation.

#### Scenario: Activated user belongs to the inviter's organization
- **WHEN** an invited person completes activation
- **THEN** their `User` record's organization matches the `OWNER` who sent the invitation, unchanged from when the invitation was created
