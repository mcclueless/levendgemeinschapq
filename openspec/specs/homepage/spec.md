# homepage Specification

## Purpose

Defines the homepage's visual composition — its split photo/colour panel structure, the duotone wash applied to its neighbourhood photography, and the contrast and performance constraints that treatment must satisfy — while leaving its wording and listings untouched. `projects` defines where the homepage projects section sits and `content-storage` defines how the page is rendered; this capability defines what the page looks like.
## Requirements
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

### Requirement: Text over homepage imagery meets contrast requirements
Every text and background pairing on the homepage SHALL meet WCAG 2.1 AA contrast, including where text is presented over or adjacent to a photograph. Because a photograph's luminance is not fixed, the system SHALL guarantee the local background behind such text rather than relying on the colour wash alone.

#### Scenario: Text over a photograph remains legible
- **WHEN** homepage text is presented over a photographic area
- **THEN** the system SHALL provide a deterministic background treatment behind that text sufficient to meet AA contrast, regardless of the underlying image

#### Scenario: Automated accessibility checks continue to pass
- **WHEN** the homepage is audited by the project's automated accessibility checks
- **THEN** it SHALL meet the configured accessibility threshold

### Requirement: Homepage imagery is served within the performance budget
Homepage photographs SHALL be served as locally hosted, appropriately sized assets in modern image formats, with intrinsic dimensions declared so that loading them causes no layout shift. The homepage SHALL NOT load its decorative photography from an external site.

#### Scenario: Images do not shift the layout
- **WHEN** the homepage loads and its photographs arrive
- **THEN** the page SHALL NOT shift its layout, and SHALL remain within the project's configured cumulative-layout-shift budget

#### Scenario: Photography is self-hosted
- **WHEN** the homepage renders its photographs
- **THEN** the system SHALL serve them from this site's own assets and SHALL NOT reference a third-party or predecessor site

#### Scenario: Each photograph keeps its intended framing
- **WHEN** a homepage photograph is cropped to fit its panel
- **THEN** the system SHALL position the crop so the photograph's subject remains visible

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
projects listing, SHALL be preserved unchanged from before this change. The
upcoming-events listing SHALL keep its title, ordering, and empty state; its
number of events follows the switchable-view requirement of the events
capability.

#### Scenario: Sections render in order
- **WHEN** a visitor opens the homepage
- **THEN** the system SHALL render the sections in the order: introduction,
  upcoming events, pillars, tagline separator, projects, who we are, photographic
  band, footer

#### Scenario: Existing listings behave as before
- **WHEN** the homepage renders its upcoming-events and projects listings
- **THEN** the projects listing SHALL present the same items, in the same order,
  with the same title, limit, and empty state as before this change, and the
  upcoming-events listing SHALL keep its title, soonest-first ordering, and empty
  state

#### Scenario: Upcoming events start at six within 90 days
- **WHEN** a visitor opens the homepage without view parameters
- **THEN** the upcoming-events listing SHALL show at most the six soonest
  occurrences from today through the next 90 days, as cards

#### Scenario: Existing hero wording is preserved
- **WHEN** the homepage renders its introductory panel
- **THEN** its heading, supporting paragraph, and call-to-action labels SHALL read
  exactly as they did before this change

