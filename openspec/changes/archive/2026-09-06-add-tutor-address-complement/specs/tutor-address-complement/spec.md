## Purpose

Lets a Tutor's address record an optional unit-level detail — apartment, floor, or house identifier — that home-visit and delivery staff can rely on to reach the right door, without affecting how the address is geocoded on a map.

## ADDED Requirements

### Requirement: Address complement is optional and freeform
The system SHALL allow a Tutor record to store an address complement value as plain text with no format constraint, and SHALL NOT require a value to be present.

#### Scenario: Tutor created without a complement
- **WHEN** a Tutor is created without an address complement
- **THEN** the Tutor record is created successfully and has no address complement value

#### Scenario: Tutor created with a complement
- **WHEN** a Tutor is created with an address complement value such as "Depto 302"
- **THEN** the Tutor record is created successfully and stores that value exactly as entered

### Requirement: Address complement is captured during Tutor registration and edit
The Tutor registration form and the Tutor edit form SHALL include an optional address complement input, positioned directly below the street address input.

#### Scenario: Registering a new Tutor
- **WHEN** a veterinarian fills out the Tutor registration form
- **THEN** an optional "Complemento (Casa, Depto, Piso, etc.)" field is available directly below "Calle y número"

#### Scenario: Editing an existing Tutor
- **WHEN** a veterinarian opens the Tutor edit form for a Tutor that already has an address complement
- **THEN** the field is pre-filled with the stored value and remains editable

### Requirement: Address complement is shown in Tutor and Patient detail when present
Tutor detail and Patient detail SHALL display the Tutor's address complement as its own line near the address, and SHALL omit that line entirely when no complement is stored.

#### Scenario: Complement present
- **WHEN** a Tutor has an address complement value
- **THEN** Tutor detail and Patient detail (via the Tutor's information) each show a line with that value

#### Scenario: Complement absent
- **WHEN** a Tutor has no address complement value
- **THEN** Tutor detail and Patient detail show no line for it

### Requirement: Address complement is excluded from the Maps link
The address string built for the Google Maps link SHALL NOT include the address complement value.

#### Scenario: Opening the Maps link for a Tutor with a complement
- **WHEN** a veterinarian opens the "Ver dirección en Maps" link for a Tutor that has an address complement
- **THEN** the Maps query contains only street address, comuna, region, and country, and does not contain the complement value
