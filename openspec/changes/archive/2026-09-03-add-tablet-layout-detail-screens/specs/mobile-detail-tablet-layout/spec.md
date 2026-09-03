## Purpose

Defines when the mobile app's detail screens are considered "tablet width" and how the Patient and Tutor detail screens arrange their content cards at that width, so the layout uses the available screen space instead of stretching phone-style single-column cards.

## ADDED Requirements

### Requirement: Tablet-width detection
The system SHALL treat a screen width of 600dp or greater as tablet width for detail-screen layout purposes, and SHALL treat a width below 600dp as phone width.

#### Scenario: Width at or above the breakpoint
- **WHEN** the screen width is 600dp or greater
- **THEN** detail screens render their tablet-width layout

#### Scenario: Width below the breakpoint
- **WHEN** the screen width is less than 600dp
- **THEN** detail screens render their existing single-column phone layout

#### Scenario: Width crosses the breakpoint while the screen is open
- **WHEN** the device rotates or the window is resized such that the width crosses the 600dp threshold while a detail screen is visible
- **THEN** the screen re-renders using the layout for the new width without requiring navigation away and back

### Requirement: Patient detail tablet layout
At tablet width, the Patient detail screen SHALL show the "Datos del paciente" and "Tutor" cards side by side in a row, with the "Consultas" card full-width below that row. At phone width, the screen SHALL keep the existing single-column stacked order (Datos del paciente, Tutor, Consultas).

#### Scenario: Patient detail at tablet width
- **WHEN** a veterinarian opens Patient detail on a screen at or above 600dp wide
- **THEN** "Datos del paciente" and "Tutor" appear side by side, and "Consultas" appears full-width below them

#### Scenario: Patient detail at phone width
- **WHEN** a veterinarian opens Patient detail on a screen narrower than 600dp
- **THEN** "Datos del paciente", "Tutor", and "Consultas" appear stacked in a single column, in that order, as they do today

### Requirement: Tutor detail tablet layout
At tablet width, the Tutor detail screen SHALL show the "Datos del tutor" and "Mascotas" cards side by side in a row. At phone width, the screen SHALL keep the existing single-column stacked order (Datos del tutor, Mascotas).

#### Scenario: Tutor detail at tablet width
- **WHEN** a veterinarian opens Tutor detail on a screen at or above 600dp wide
- **THEN** "Datos del tutor" and "Mascotas" appear side by side, each sized to its own content rather than forced to equal height

#### Scenario: Tutor detail at phone width
- **WHEN** a veterinarian opens Tutor detail on a screen narrower than 600dp
- **THEN** "Datos del tutor" and "Mascotas" appear stacked in a single column, in that order, as they do today
