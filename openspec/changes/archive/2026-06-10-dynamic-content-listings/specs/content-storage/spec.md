## MODIFIED Requirements

### Requirement: Caching and invalidation policy
The system SHALL apply a caching policy appropriate to read-heavy, infrequently-changing content. **Index/listing pages** (the agenda, venues, organisers, and blog overviews) SHALL be rendered per request from the source of truth so that newly published, edited, hidden, or removed items appear immediately. **Detail pages and static pages** SHALL be served from cache/CDN and SHALL be revalidated within a defined freshness window when content is published or updated.

#### Scenario: Listing pages reflect changes immediately
- **WHEN** an item is published, edited, hidden, or removed through the backend
- **THEN** the corresponding listing page SHALL reflect the change on its next request, without waiting for a time-based freshness window

#### Scenario: Cached delivery of detail and static pages
- **WHEN** a published detail or static page is requested by visitors
- **THEN** the system SHALL serve it from cache/CDN without re-reading source documents on every request

#### Scenario: Detail pages revalidate on publish
- **WHEN** content is published or updated through the backend
- **THEN** the system SHALL revalidate the affected detail pages so the change becomes visible within the defined freshness window
