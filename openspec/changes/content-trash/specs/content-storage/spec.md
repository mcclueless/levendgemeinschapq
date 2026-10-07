## ADDED Requirements

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
