## ADDED Requirements

### Requirement: Markdown/MDX content in S3
The system SHALL persist Event, Venue, Organiser, and Blog content as Markdown or MDX documents in S3. Each document SHALL carry structured frontmatter for its typed fields (e.g., event start/end, venue/organiser references, contact info) and a body for rich content.

#### Scenario: Saving content as MD/MDX
- **WHEN** content is created or edited through the backend
- **THEN** the system SHALL write a Markdown/MDX document with frontmatter to the appropriate S3 location

#### Scenario: Frontmatter validation
- **WHEN** a content document is loaded
- **THEN** the system SHALL validate the frontmatter against the schema for that content type and SHALL surface an error for malformed documents rather than rendering them broken

### Requirement: Render pipeline
The system SHALL render MD/MDX content into accessible HTML for the public site, resolving references (such as an event's Venue and Organiser) at render or build time.

#### Scenario: Rendering referenced entities
- **WHEN** an event document referencing a Venue and Organiser is rendered
- **THEN** the system SHALL resolve those references and produce links to the corresponding Venue and Organiser pages

### Requirement: Caching and invalidation policy
The system SHALL apply a caching policy appropriate to read-heavy, infrequently-changing content, serving public content from cache/CDN, and SHALL invalidate or revalidate affected content when it is published or updated.

#### Scenario: Cached delivery
- **WHEN** a published page is requested by visitors
- **THEN** the system SHALL serve it from cache/CDN without re-reading source documents on every request

#### Scenario: Invalidation on publish
- **WHEN** content is published or updated through the backend
- **THEN** the system SHALL invalidate or revalidate the affected pages so the change becomes visible within the defined freshness window
