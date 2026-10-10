# content-storage Specification

## Purpose

Defines how content is persisted and served: Markdown/MDX documents with typed frontmatter in S3, the render pipeline that resolves entity references, and the caching/invalidation policy for read-heavy public content.

## Requirements

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

### Requirement: Caching and invalidation policy
The system SHALL apply a caching policy appropriate to read-heavy, infrequently-changing content. **Pages that surface live content listings** — the index/listing pages (the agenda, venues, organisers, and blog overviews) and the **homepage** (which shows an upcoming-events preview) — SHALL be rendered per request from the source of truth so that newly published, edited, hidden, or removed items appear immediately, with no CDN-cache lag. **Content detail pages and genuinely static pages** SHALL be served from cache/CDN and SHALL be revalidated within a defined freshness window when content is published or updated.

#### Scenario: Listing pages reflect changes immediately
- **WHEN** an item is published, edited, hidden, or removed through the backend
- **THEN** the corresponding listing page SHALL reflect the change on its next request, without waiting for a time-based freshness window

#### Scenario: Homepage reflects changes immediately
- **WHEN** an item shown in the homepage's upcoming-events preview is edited, hidden, or removed through the backend
- **THEN** the homepage SHALL reflect the change on its next request, without waiting for a time-based freshness window or a CDN invalidation

#### Scenario: Cached delivery of detail and static pages
- **WHEN** a published detail or static page is requested by visitors
- **THEN** the system SHALL serve it from cache/CDN without re-reading source documents on every request

#### Scenario: Detail pages revalidate on publish
- **WHEN** content is published or updated through the backend
- **THEN** the system SHALL revalidate the affected detail pages so the change becomes visible within the defined freshness window

### Requirement: Trashed documents are stored apart from live content
The system SHALL store a trashed document outside the per-type content locations, under a dedicated trash location that keeps the document's content type and slug, together with the moment it was trashed. The document's frontmatter and body SHALL be preserved unchanged apart from the trash marker, so that a restore returns the document as it was.

#### Scenario: Moving a document to the trash
- **WHEN** a content item is moved to the trash
- **THEN** its document SHALL no longer exist at its per-type location and SHALL exist at the trash location for that type and slug, carrying the trashed moment

#### Scenario: Restoring a document
- **WHEN** a trashed document is restored
- **THEN** it SHALL exist again at its per-type location with the trash marker removed and its other frontmatter and body intact, and SHALL no longer exist at the trash location

#### Scenario: Both backends behave the same
- **WHEN** the content store is the local filesystem or the S3 bucket
- **THEN** trash, restore, and purge SHALL behave identically, and the local trash location SHALL NOT be part of the committed content seed

### Requirement: Trashed documents are invisible to live content
A trashed document SHALL NOT be rendered on the public site, SHALL NOT appear in any listing, count, or derived index, SHALL NOT be loaded when validating frontmatter of live content, SHALL NOT count as a referrer in any reference guard, and SHALL NOT reserve its slug: a new item or a permalink change MAY take the slug of a trashed item.

#### Scenario: Trashed document excluded from rendering and index
- **WHEN** the public site, a backend list, the dashboard counts, or the derived index reads content
- **THEN** no trashed document SHALL be included

#### Scenario: Trashed referrer does not count
- **WHEN** a reference guard scans for items referencing a Venue or Organisation
- **THEN** trashed documents SHALL NOT be scanned

#### Scenario: Slug of a trashed item is free
- **WHEN** a new item is created, or a permalink is changed, to a slug that only a trashed document uses
- **THEN** the system SHALL allow it and SHALL NOT append a suffix

#### Scenario: Malformed trashed document stays manageable
- **WHEN** a trashed document no longer validates against its type's current schema
- **THEN** the trash page SHALL still list it by its stored title or slug and SHALL still allow it to be restored or permanently deleted
