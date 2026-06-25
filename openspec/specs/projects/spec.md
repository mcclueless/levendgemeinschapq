# projects Specification

## Purpose

Defines the `project` content type — neighbourhood initiatives that reference one location (Venue) and one or more organisers (Organiser) — and its public surfaces: the `/projecten` overview, project detail pages, the homepage projects section, and the site navigation entry.

## Requirements

### Requirement: Project content type
The system SHALL provide a `project` content type representing a neighbourhood initiative. Each project SHALL have a title, a description body (MDX), an optional cover image, exactly one referenced location (Venue), and one or more referenced organisers (Organiser). The system SHALL stamp each project with a creation date used solely for ordering, set automatically when the project is first saved and preserved across later edits; this date SHALL NOT be an editor-entered field. Each project SHALL carry a publish status, and only published projects SHALL appear on the public site.

#### Scenario: A project references one location and several organisers
- **WHEN** a published project referencing a Venue and two Organisers is loaded for the public site
- **THEN** the system SHALL resolve the single Venue reference and both Organiser references to their records, producing links to the corresponding Venue and Organiser pages

#### Scenario: Unknown references degrade gracefully
- **WHEN** a project references a Venue or Organiser slug that no longer exists
- **THEN** the system SHALL omit the missing reference rather than render a broken link, still showing the project with its remaining resolved references

#### Scenario: Unpublished projects are hidden from the public site
- **WHEN** a project's status is not `published`
- **THEN** the system SHALL exclude it from the public overview, the homepage section, and SHALL NOT serve its public detail page

### Requirement: Projects overview page
The system SHALL provide a public overview page at `/projecten` that lists all published projects ordered newest first by their creation date. The overview SHALL NOT present a sort or filter control.

#### Scenario: Newest-first listing
- **WHEN** a visitor opens `/projecten`
- **THEN** the system SHALL display every published project, ordered from newest to oldest, each linking to its detail page

#### Scenario: Empty state
- **WHEN** a visitor opens `/projecten` and no published projects exist
- **THEN** the system SHALL render the page with an empty-state message rather than an error

### Requirement: Project detail page
The system SHALL provide a public detail page at `/projecten/<slug>` for each published project, showing its cover image (when present), title, rendered MDX description, the single location, and the list of organisers with links to their pages.

#### Scenario: Rendering a project
- **WHEN** a visitor opens the detail page of a published project
- **THEN** the system SHALL render its title, cover image, description, a location block linking to the Venue, and each organiser linking to its Organiser page

#### Scenario: Missing project
- **WHEN** a visitor requests `/projecten/<slug>` for a slug that is not a published project
- **THEN** the system SHALL respond with a not-found page

### Requirement: Featured projects on the homepage
The homepage SHALL present a projects section, positioned below the upcoming-events section, featuring at most the six newest published projects and a link to the projects overview. When no published projects exist, the section SHALL render an empty state without error.

#### Scenario: Showing the newest projects
- **WHEN** a visitor opens the homepage and published projects exist
- **THEN** the system SHALL show up to six of them, newest first, with a link to `/projecten`

#### Scenario: More projects than shown
- **WHEN** more than six published projects exist
- **THEN** the homepage section SHALL show only the six newest and SHALL provide a "more projects" link to the overview

### Requirement: Projects in site navigation
The system SHALL include a "Projecten" entry in the main navigation and in the footer navigation, linking to the projects overview.

#### Scenario: Navigating to projects
- **WHEN** a visitor uses the main or footer navigation
- **THEN** the system SHALL present a "Projecten" link that opens `/projecten`
