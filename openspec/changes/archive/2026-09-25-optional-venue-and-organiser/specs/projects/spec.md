## MODIFIED Requirements

### Requirement: Project content type
The system SHALL provide a `project` content type representing a neighbourhood initiative. Each project SHALL have a title, a description body (MDX), an optional cover image, an optional referenced location (Venue), and one or more referenced organisers (Organiser). The system SHALL stamp each project with a creation date used solely for ordering, set automatically when the project is first saved and preserved across later edits; this date SHALL NOT be an editor-entered field. Each project SHALL carry a publish status, and only published projects SHALL appear on the public site.

#### Scenario: A project references one location and several organisers
- **WHEN** a published project referencing a Venue and two Organisers is loaded for the public site
- **THEN** the system SHALL resolve the single Venue reference and both Organiser references to their records, producing links to the corresponding Venue and Organiser pages

#### Scenario: A project without a location
- **WHEN** a project that names no location is saved and presented
- **THEN** the system SHALL accept it and SHALL present it without a location, while still requiring at least one organiser

#### Scenario: Unknown references degrade gracefully
- **WHEN** a project references a Venue or Organiser slug that no longer exists
- **THEN** the system SHALL omit the missing reference rather than render a broken link, still showing the project with its remaining resolved references

#### Scenario: Unpublished projects are hidden from the public site
- **WHEN** a project's status is not `published`
- **THEN** the system SHALL exclude it from the public overview, the homepage section, and SHALL NOT serve its public detail page

### Requirement: Project detail page
The system SHALL provide a public detail page at `/projecten/<slug>` for each published project, showing its cover image (when present), title, rendered MDX description, its location when it has one, and the list of organisers with links to their pages.

#### Scenario: Rendering a project
- **WHEN** a visitor opens the detail page of a published project
- **THEN** the system SHALL render its title, cover image, description, a location block linking to the Venue when one is set, and each organiser linking to its Organiser page

#### Scenario: A project with no location
- **WHEN** a visitor opens the detail page of a project that names no location
- **THEN** the page SHALL omit the location block entirely and SHALL still show the organisers

#### Scenario: Missing project
- **WHEN** a visitor requests `/projecten/<slug>` for a slug that is not a published project
- **THEN** the system SHALL respond with a not-found page
