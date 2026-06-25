## MODIFIED Requirements

### Requirement: Create and edit all content types
The backend SHALL allow authorized users to create and edit Events, Venues, Organisations, Blog posts, and Projects through forms appropriate to each type. When editing an existing item, the system SHALL keep the item's slug stable and SHALL preserve frontmatter fields not present on the edit form (for example calendar UID, venue gallery images, blog relationships, a project's automatically-assigned ordering date, and submission metadata).

#### Scenario: Creating each content type
- **WHEN** an authorized user opens the create form for an Event, Venue, Organisation, Blog post, or Project
- **THEN** the system SHALL present the fields for that type and SHALL persist a valid submission as MD/MDX content

#### Scenario: Editing an existing item
- **WHEN** an Administrator opens the edit form for an existing Event, Venue, Organisation, Blog post, or Project
- **THEN** the system SHALL prefill the form from the stored document, and on save SHALL update the same document in place, keeping its slug and any fields the form does not expose

## ADDED Requirements

### Requirement: Relationship selectors on the project form
The project create and edit forms SHALL present the single location as a drop-down selector populated from existing Venue records, and the organisers as a multi-select control populated from existing Organiser records that accepts one or more selections. The form SHALL require at least one organiser before a project can be saved.

#### Scenario: Location and organiser selectors reflect existing records
- **WHEN** an editor opens the project form after Venues and Organisers have been created
- **THEN** the system SHALL populate the location drop-down and the organisers multi-select with those records

#### Scenario: At least one organiser is required
- **WHEN** an editor attempts to save a project without selecting any organiser
- **THEN** the system SHALL reject the submission and SHALL NOT persist a project with no organisers

### Requirement: Projects are admin-only with no public submission
Projects SHALL be created and managed only through the authenticated editorial backend. The system SHALL NOT expose a public submission form for projects and SHALL NOT place projects into the approval/review queue.

#### Scenario: No public project submission
- **WHEN** a visitor who is not an authenticated editor looks for a way to submit a project
- **THEN** the system SHALL NOT provide a public project submission form

#### Scenario: Projects bypass the review queue
- **WHEN** a project is created through the backend
- **THEN** the system SHALL save it directly without creating a pending review-queue entry
