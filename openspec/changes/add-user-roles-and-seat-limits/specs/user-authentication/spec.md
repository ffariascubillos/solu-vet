# Spec Delta

## MODIFIED Requirements

### Requirement: Protected endpoints require a valid access token
The system SHALL reject any request to an endpoint that requires authentication when no access token is presented, or when the presented token is missing, malformed, expired, or has an invalid signature. It SHALL also reject a correctly signed, unexpired token when its user no longer exists or when that user's sessions were revoked after the token was issued (log out of all devices or a completed password reset).

#### Scenario: Missing access token
- **WHEN** a request to a protected endpoint carries no access token
- **THEN** the system rejects the request as unauthenticated

#### Scenario: Expired access token
- **WHEN** a request to a protected endpoint carries an access token past its expiration
- **THEN** the system rejects the request as unauthenticated

#### Scenario: Access token of a removed user
- **WHEN** a request carries an unexpired access token whose user was removed from the organization
- **THEN** the system rejects the request as unauthenticated

#### Scenario: Access token issued before the sessions were revoked
- **WHEN** a request carries an unexpired access token issued before its user logged out of all devices or reset their password
- **THEN** the system rejects the request as unauthenticated

### Requirement: Completing a password reset revokes existing sessions
The system SHALL revoke every session belonging to a user when their password is successfully reset, so a session established before the reset can neither be refreshed nor keep using its current access token.

#### Scenario: Prior sessions invalidated after reset
- **WHEN** a user completes a password reset
- **THEN** any refresh token issued to that user before the reset can no longer be used to obtain a new access token

#### Scenario: Prior access tokens stop working after reset
- **WHEN** a user completes a password reset and a device then calls a protected endpoint with an access token issued before the reset
- **THEN** the system rejects the request as unauthenticated

## ADDED Requirements

### Requirement: User can log out of all devices immediately
The system SHALL let an authenticated user end every session issued to them, across every device, in a single request, so a lost, stolen, or unattended device is cut off immediately without changing the account's password. Both the refresh tokens and every access token already issued SHALL stop working as soon as the request completes.

#### Scenario: Successful logout of all devices
- **WHEN** an authenticated user requests to log out of all devices
- **THEN** every refresh token belonging to that user is revoked, including ones issued to other devices, and none can be used afterward to obtain a new access token

#### Scenario: Access tokens stop working immediately after a full logout
- **WHEN** a device calls a protected endpoint with an access token issued before a completed "log out of all devices" request
- **THEN** the system rejects the request as unauthenticated, without waiting for the token to expire

#### Scenario: Logging in again after a full logout
- **WHEN** a user logs in after logging out of all devices
- **THEN** the new session works normally

### Requirement: Registration rejects an email with a pending invitation
The system SHALL reject registration when the submitted email has a pending, unexpired invitation from any organization, so the invited person activates the invitation instead of creating a separate organization by mistake. The response SHALL NOT reveal which organization sent the invitation. Once the invitation expires or is cancelled, the email MAY register.

#### Scenario: Registering with an invited email
- **WHEN** registration is submitted with an email that has a pending, unexpired invitation
- **THEN** the system rejects it as a conflict on the email field with the message "Este correo tiene una invitación pendiente. Revisa tu bandeja de entrada para activar tu cuenta.", and no `Organization` or `User` is created

#### Scenario: Registering after the invitation expired
- **WHEN** registration is submitted with an email whose only invitation has expired
- **THEN** the registration succeeds

## REMOVED Requirements

### Requirement: User can log out of all devices in one action
**Reason**: Its "Access token already in memory keeps working briefly after a full logout" scenario is the behavior this change eliminates; the requirement is restated without that window as "User can log out of all devices immediately".
**Migration**: Same endpoint (`POST /api/auth/logout-all`) and client flow; access tokens issued before the request now get 401 at once and the client falls back to login through the existing refresh interceptor.
