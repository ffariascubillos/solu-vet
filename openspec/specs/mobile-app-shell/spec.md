# mobile-app-shell Specification

## Purpose

Defines the mobile app's app-level branding, the Home greeting for the signed-in user, and the navigation paths between Home, the drawer, patient detail and tutor detail, so the veterinarian can always get back to Home and move from a patient to its tutor.

## Requirements

### Requirement: App is branded SoluVet
The drawer header title shown above the tab screens SHALL read "SoluVet".

#### Scenario: Opening the app while signed in
- **WHEN** a signed-in user lands on any tab screen
- **THEN** the header title reads "SoluVet" and no screen shows "HuellaVet"

### Requirement: Home greets the signed-in user by name
The Home screen SHALL greet the signed-in user with "¡Hola, <name>!" using the name from the current session, and SHALL NOT show any hardcoded person name.

#### Scenario: User with a name
- **WHEN** a user whose session name is "Camila Rojas" opens Home
- **THEN** the greeting reads "¡Hola, Camila Rojas!"

#### Scenario: User without a name
- **WHEN** the session has no name or an empty name
- **THEN** the greeting reads "¡Hola!" with no trailing comma or placeholder text

### Requirement: Drawer "Inicio" always leads to Home
Pressing the "Inicio" item in the drawer SHALL navigate to the Home tab and close the drawer, from any tab screen, with the same destination as the Home icon in the bottom tab bar.

#### Scenario: From the tutor registration screen
- **WHEN** the user is on "Registrar tutor", opens the drawer and presses "Inicio"
- **THEN** the drawer closes and the Home screen is shown

#### Scenario: Already on Home
- **WHEN** the user is on Home, opens the drawer and presses "Inicio"
- **THEN** the drawer closes and Home remains shown

### Requirement: Patient detail links to its tutor
The Patient detail screen SHALL offer a "Ver tutor" action inside the Tutor card that opens the detail screen of that patient's tutor.

#### Scenario: Navigating from patient to tutor
- **WHEN** the user is on a patient's detail screen and presses "Ver tutor"
- **THEN** the tutor detail screen for that patient's tutor is shown, listing its patients
