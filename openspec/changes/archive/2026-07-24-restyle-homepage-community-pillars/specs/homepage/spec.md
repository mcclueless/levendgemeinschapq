## MODIFIED Requirements

### Requirement: Photographic split panels on the homepage
The homepage SHALL present its introductory content as a split panel pairing a
photograph with an adjacent flat colour panel carrying the text, and SHALL
additionally present a full-width photographic band positioned flush directly
above the site footer. The photographs SHALL depict the neighbourhood the site
serves.

#### Scenario: Homepage presents its photography
- **WHEN** a visitor opens the homepage
- **THEN** the system SHALL render a photographic split panel alongside the
  introductory heading and call-to-action, and a full-width photographic band
  immediately above the footer

#### Scenario: Photographic band leads into the footer
- **WHEN** the homepage renders the photographic band above the footer
- **THEN** the band SHALL sit flush against the footer with no separating border
  or gap between them

#### Scenario: Panels adapt to narrow screens
- **WHEN** the homepage is viewed on a narrow screen
- **THEN** the system SHALL present the panel content without horizontal overflow
  and without obscuring any text

## ADDED Requirements

### Requirement: Homepage presents the organisation's activities and identity
The homepage SHALL present, in addition to its listings, a "what we do" section
describing the organisation's three pillars — Muziek & Concerten, Sociale
Ontmoetingen, and Tuinen & Natuur — each as a photograph with its label, and a
"who we are" section listing the organisation's organisatoren as cover-image cards
that each link to the corresponding organiser page. A tagline separator SHALL
appear between the pillars and the projects section.

#### Scenario: The three pillars are shown
- **WHEN** a visitor opens the homepage
- **THEN** the system SHALL render three labelled pillar tiles — Muziek &
  Concerten, Sociale Ontmoetingen, and Tuinen & Natuur — each pairing a
  photograph with its label

#### Scenario: Who-we-are links to organiser pages
- **WHEN** a visitor opens the homepage and organisatoren exist
- **THEN** the system SHALL render each organiser as a cover-image card linking to
  its `/organisatoren/<slug>` page

#### Scenario: Who-we-are with no organisers
- **WHEN** a visitor opens the homepage and no organisatoren exist
- **THEN** the system SHALL render the page without error and without an empty
  organiser grid

#### Scenario: Tagline separator is present
- **WHEN** the homepage renders
- **THEN** it SHALL display the tagline "Het levde is een feestje, maar je moet de
  slingers zelf ophangen" as a full-width separator between the pillars and the
  projects section

### Requirement: Homepage section order
The homepage SHALL present its sections in a fixed top-to-bottom order:
introductory split panel, upcoming-events listing, the three pillars, the tagline
separator, the projects listing, the who-we-are organiser grid, the photographic
band, and the footer. The introductory heading, supporting text, and
call-to-action labels, and the titles, limits, ordering, and empty states of the
upcoming-events and projects listings, SHALL be preserved unchanged from before
this change.

#### Scenario: Sections render in order
- **WHEN** a visitor opens the homepage
- **THEN** the system SHALL render the sections in the order: introduction,
  upcoming events, pillars, tagline separator, projects, who we are, photographic
  band, footer

#### Scenario: Existing listings behave as before
- **WHEN** the homepage renders its upcoming-events and projects listings
- **THEN** those listings SHALL present the same items, in the same order, with the
  same titles, limits, and empty states as before this change

#### Scenario: Existing hero wording is preserved
- **WHEN** the homepage renders its introductory panel
- **THEN** its heading, supporting paragraph, and call-to-action labels SHALL read
  exactly as they did before this change

## REMOVED Requirements

### Requirement: Homepage photography is tinted to the site palette
**Reason**: The community found the green wash muddied the neighbourhood
photographs; this change presents them untreated. The photographs no longer need
a unifying tint because they are now the organisation's own curated images.
**Migration**: Remove the `Wash` overlay from the homepage photo components; no
data or configuration migration is required. The palette tokens themselves are
unchanged and no new palette colours are introduced.

### Requirement: Homepage content and wording are unchanged by presentation
**Reason**: This change deliberately adds narrative sections (the three pillars,
the tagline separator, and the who-we-are grid) with new wording, so a blanket
"wording is unchanged" guarantee no longer holds.
**Migration**: The preservation guarantees that remain relevant — the hero
wording and the upcoming-events and projects listing titles, limits, ordering, and
empty states — are carried forward by the "Homepage section order" requirement.
