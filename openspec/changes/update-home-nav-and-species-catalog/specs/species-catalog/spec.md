## ADDED Requirements

### Requirement: Species use Chilean clinical names
The species catalog SHALL name dogs "Canino" and cats "Felino", and SHALL NOT contain species named "Perro" or "Gato".

#### Scenario: Listing species
- **WHEN** a client calls `GET /api/species`
- **THEN** the list includes "Canino" and "Felino" and includes neither "Perro" nor "Gato"

### Requirement: Catalog covers common companion and exotic species
The species catalog SHALL include, in addition to Canino and Felino: "Lagomorfo", "Erizo de tierra", "Hurón", "Cobayo", "Hámster", "Chinchilla", "Ave" and "Reptil". Every species SHALL have at least one breed, so a patient of any listed species can be registered.

#### Scenario: Registering a rabbit
- **WHEN** a veterinarian registers a patient and selects species "Lagomorfo"
- **THEN** the breed selector offers at least one Lagomorfo breed and the patient can be saved

#### Scenario: Every species has breeds
- **WHEN** a client calls `GET /api/breeds?speciesId=<id>` for any species in the catalog
- **THEN** the response contains at least one breed

### Requirement: Cat breeds distinguish domestic short and long hair
The Felino breed list SHALL include "Doméstico de pelo corto" and "Doméstico de pelo largo", and SHALL NOT include "Mestizo / Sin raza definida".

#### Scenario: Listing cat breeds
- **WHEN** a client lists the breeds of species "Felino"
- **THEN** the list includes "Doméstico de pelo corto" and "Doméstico de pelo largo" and does not include "Mestizo / Sin raza definida"

### Requirement: Catalog renames preserve existing patients
Renaming a species or breed in the catalog SHALL update the existing record in place, keeping its id, so every patient that referenced it keeps referencing it under the new name. A rename SHALL NOT create a duplicate record alongside the old one.

#### Scenario: Existing dog patient after the rename
- **WHEN** a patient was registered with species "Perro" before the rename is applied
- **THEN** after the rename the same patient shows species "Canino", and the catalog contains a single Canino species

#### Scenario: Existing mixed-breed cat after the rename
- **WHEN** a patient was registered as a "Gato" with breed "Mestizo / Sin raza definida" before the rename
- **THEN** after the rename the same patient shows species "Felino" and breed "Doméstico de pelo corto"
