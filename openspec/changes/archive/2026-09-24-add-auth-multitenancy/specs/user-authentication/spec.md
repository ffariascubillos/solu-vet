## Purpose

Lets an independent veterinarian or a clinic owner register, log in, stay signed in across a normal working day on mobile and web using a short-lived access token and a rotating refresh token, and recover access to their own account if they forget their password.

## ADDED Requirements

### Requirement: Independent veterinarian registration
The system SHALL let a solo veterinarian register in a single step that creates an `Organization` (`type = INDEPENDENT`) and a `User` with role `OWNER`, bound to that `Organization`.

#### Scenario: Successful independent registration
- **WHEN** a solo veterinarian submits registration with a valid email, password and name
- **THEN** an `Organization` and an `OWNER` `User` are created together and the response includes a session (access token and refresh token)

### Requirement: Clinic registration
The system SHALL let a clinic owner register in a single step that creates an `Organization` (`type = CLINIC`) and a `User` with role `OWNER`, bound to that `Organization`. Additional clinic users are added afterward through the invitation flow, not through registration.

#### Scenario: Successful clinic registration
- **WHEN** a clinic owner submits registration with a valid email, password, name and clinic name
- **THEN** an `Organization` of type `CLINIC` and an `OWNER` `User` are created together and the response includes a session

### Requirement: Registration rejects a duplicate email
The system SHALL reject registration when the submitted email is already associated with an existing `User`, regardless of which organization that user belongs to.

#### Scenario: Email already registered
- **WHEN** registration is submitted with an email that already belongs to a `User`
- **THEN** the system rejects the request with a message identifying the email field as the conflict, and no new `Organization` or `User` is created

### Requirement: Login issues an access token and a refresh token
The system SHALL authenticate a user by email and password and, on success, issue a short-lived access token carrying the user's id, organization id and role, plus a separate longer-lived refresh token.

#### Scenario: Successful login
- **WHEN** a user submits a registered email with the correct password
- **THEN** the system returns an access token, a refresh token, and the user's profile and organization

#### Scenario: Login with incorrect password
- **WHEN** a user submits a registered email with an incorrect password
- **THEN** the system rejects the request without revealing whether the email exists

#### Scenario: Login with unregistered email
- **WHEN** a user submits an email that has no matching account
- **THEN** the system rejects the request with the same generic failure used for an incorrect password

### Requirement: Refresh token rotation
The system SHALL let a client exchange a valid, unexpired, unrevoked refresh token for a new access token and a new refresh token, and SHALL invalidate the refresh token that was exchanged so it cannot be used again.

#### Scenario: Successful refresh
- **WHEN** a client submits a valid, unused refresh token
- **THEN** the system returns a new access token and a new refresh token, and the submitted refresh token can no longer be used

#### Scenario: Reused refresh token is rejected and revokes the session
- **WHEN** a client submits a refresh token that was already exchanged for a newer one
- **THEN** the system rejects the request and revokes every refresh token descended from that session, requiring the user to log in again

#### Scenario: Expired refresh token is rejected
- **WHEN** a client submits a refresh token past its expiration date
- **THEN** the system rejects the request and requires the user to log in again

### Requirement: Logout revokes the session
The system SHALL let an authenticated user end their session by revoking their current refresh token, so it can no longer be exchanged for new tokens.

#### Scenario: Successful logout
- **WHEN** an authenticated user logs out
- **THEN** their refresh token is revoked and any later attempt to use it to refresh is rejected

### Requirement: Protected endpoints require a valid access token
The system SHALL reject any request to an endpoint that requires authentication when no access token is presented, or when the presented token is missing, malformed, expired, or has an invalid signature.

#### Scenario: Missing access token
- **WHEN** a request to a protected endpoint carries no access token
- **THEN** the system rejects the request as unauthenticated

#### Scenario: Expired access token
- **WHEN** a request to a protected endpoint carries an access token past its expiration
- **THEN** the system rejects the request as unauthenticated

### Requirement: Password reset request never reveals whether an email is registered
The system SHALL respond identically to a password reset request regardless of whether the submitted email belongs to a registered `User`. When it does, the system SHALL email a single-use, expiring reset link to that address; when it does not, no email is sent, but the response gives the requester no indication of that.

#### Scenario: Reset requested for a registered email
- **WHEN** a password reset is requested for an email that belongs to a `User`
- **THEN** the system sends a reset link to that email and returns the same generic acknowledgment used for an unregistered email

#### Scenario: Reset requested for an unregistered email
- **WHEN** a password reset is requested for an email with no matching `User`
- **THEN** the system sends no email and returns the same generic acknowledgment used for a registered email

### Requirement: Password reset never transmits a plaintext password
The system SHALL NOT generate or email a plaintext password during password recovery. It SHALL email a link containing a single-use reset token that lets the account holder choose their own new password.

#### Scenario: Reset email contains a link, not a password
- **WHEN** a password reset email is sent
- **THEN** it contains a reset link and no password

### Requirement: Password reset token is single-use and time-limited
The system SHALL reject a password reset confirmation when the token is unknown, already used, or past its expiration, and SHALL NOT change the account's password in that case.

#### Scenario: Successful password reset
- **WHEN** the account holder submits a valid, unused, unexpired reset token with a new password
- **THEN** the system sets that password on their `User` account, marks the token used, and they can now log in with the new password

#### Scenario: Expired reset token
- **WHEN** the account holder submits a reset token past its expiration
- **THEN** the system rejects the request and the password is not changed

#### Scenario: Already-used reset token
- **WHEN** the account holder submits a reset token that already completed a password reset
- **THEN** the system rejects the request and the password is not changed

### Requirement: Completing a password reset revokes existing sessions
The system SHALL revoke every refresh token belonging to a user when their password is successfully reset, so a session established before the reset cannot continue to be refreshed.

#### Scenario: Prior sessions invalidated after reset
- **WHEN** a user completes a password reset
- **THEN** any refresh token issued to that user before the reset can no longer be used to obtain a new access token

### Requirement: User can log out of all devices in one action
The system SHALL let an authenticated user revoke every refresh token issued to them, across every device and session, in a single request, so a lost, stolen, or unattended device can be cut off immediately without waiting for its session to expire or changing the account's password.

#### Scenario: Successful logout of all devices
- **WHEN** an authenticated user requests to log out of all devices
- **THEN** every refresh token belonging to that user is revoked, including ones issued to other devices, and none can be used afterward to obtain a new access token

#### Scenario: Access token already in memory keeps working briefly after a full logout
- **WHEN** a device's access token was issued before a "log out of all devices" request completes
- **THEN** that access token continues to work until its own short expiration, since only refresh tokens are revoked directly; it stops working once it expires naturally and cannot be renewed
