## MODIFIED Requirements

### Requirement: Markdown/MDX content in S3
The system SHALL persist Event, Venue, Organiser, Blog, and Project content as Markdown or MDX documents in S3. Each document SHALL carry structured frontmatter for its typed fields (e.g., event start/end, venue/organiser references, contact info, a project's single location and multiple organisers) and a body for rich content.

#### Scenario: Saving content as MD/MDX
- **WHEN** content is created or edited through the backend
- **THEN** the system SHALL write a Markdown/MDX document with frontmatter to the appropriate S3 location

#### Scenario: Frontmatter validation
- **WHEN** a content document is loaded
- **THEN** the system SHALL validate the frontmatter against the schema for that content type and SHALL surface an error for malformed documents rather than rendering them broken

### Requirement: Render pipeline
The system SHALL render MD/MDX content into accessible HTML for the public site, resolving references (such as an event's Venue and Organiser, or a project's Venue and its Organisers) at render or build time.

#### Scenario: Rendering referenced entities
- **WHEN** an event document referencing a Venue and Organiser is rendered
- **THEN** the system SHALL resolve those references and produce links to the corresponding Venue and Organiser pages

#### Scenario: Rendering a project's references
- **WHEN** a project document referencing one Venue and one or more Organisers is rendered
- **THEN** the system SHALL resolve those references and produce links to the corresponding Venue and Organiser pages, omitting any reference that cannot be resolved
