## Purpose

Organization is the tenant isolation boundary for soluVet: every user, tutor, patient and consultation belongs to exactly one Organization, and its shape anticipates a future trial/subscription model without requiring a redesign later.

## ADDED Requirements

### Requirement: Organization represents a tenant
The system SHALL represent each independent veterinarian or clinic as a single `Organization` record with a `type` of either `INDEPENDENT` or `CLINIC`.

#### Scenario: Independent veterinarian organization
- **WHEN** a solo veterinarian registers
- **THEN** an `Organization` is created with `type = INDEPENDENT`

#### Scenario: Clinic organization
- **WHEN** a clinic owner registers
- **THEN** an `Organization` is created with `type = CLINIC`

### Requirement: Every user belongs to exactly one organization
The system SHALL require every `User` to be associated with exactly one `Organization`. A user account SHALL NOT exist without an owning `Organization`, and a user SHALL NOT belong to more than one `Organization` at a time.

#### Scenario: User created without an organization is rejected
- **WHEN** a `User` record is created with no `organizationId`
- **THEN** the system rejects the operation

### Requirement: Organization starts a trial period on creation
The system SHALL record a trial end date on every `Organization` at creation time, set to 21 days after creation, so a future paid-plan enforcement can rely on it without changing the `Organization` shape.

#### Scenario: Trial end date set at registration
- **WHEN** a new `Organization` is created
- **THEN** its trial end date is set to 21 days from the creation timestamp

### Requirement: Organization tracks a subscription status without enforcing it
The system SHALL record a `subscriptionStatus` on every `Organization` (`TRIALING`, `ACTIVE`, `PAST_DUE`, or `CANCELED`), defaulting to `TRIALING` at creation. This change SHALL NOT enforce any restriction based on this status, process payments, or expire access when the trial ends — it only stores the state a future billing capability will read and update.

#### Scenario: New organization defaults to trialing
- **WHEN** a new `Organization` is created
- **THEN** its `subscriptionStatus` is `TRIALING`

#### Scenario: Trial expiry does not block access in this change
- **WHEN** an `Organization`'s trial end date has passed
- **THEN** its users can still log in and use the system without restriction
