## MODIFIED Requirements

### Requirement: Homepage presents the organisation's activities and identity
The homepage SHALL present, in addition to its listings, a "what we do" section
describing the organisation's three pillars — Muziek & Concerten, Sociale
Ontmoetingen, and Tuinen & Natuur — each as a photograph with its label, and a
"who we are" section listing the organisation's organisatoren as cards that each
link to the corresponding organiser page and show the image chosen by the
organiser card image rule of the organisers capability (logo, otherwise cover,
otherwise the name on a brand panel). A tagline separator SHALL appear between
the pillars and the projects section.

#### Scenario: The three pillars are shown
- **WHEN** a visitor opens the homepage
- **THEN** the system SHALL render three labelled pillar tiles — Muziek &
  Concerten, Sociale Ontmoetingen, and Tuinen & Natuur — each pairing a
  photograph with its label

#### Scenario: Who-we-are links to organiser pages
- **WHEN** a visitor opens the homepage and organisatoren exist
- **THEN** the system SHALL render each organiser as a card linking to its
  `/organisatoren/<slug>` page, showing its logo when it has one and otherwise
  its cover image or its name on a brand panel

#### Scenario: Who-we-are with no organisers
- **WHEN** a visitor opens the homepage and no organisatoren exist
- **THEN** the system SHALL render the page without error and without an empty
  organiser grid

#### Scenario: Tagline separator is present
- **WHEN** the homepage renders
- **THEN** it SHALL display the tagline "Het leven is een feestje, maar je moet de
  slingers zelf ophangen" as a full-width separator between the pillars and the
  projects section
