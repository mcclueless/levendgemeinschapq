## ADDED Requirements

### Requirement: Per-page metadata
Every public page SHALL provide descriptive, unique title and meta description tags and social-sharing (Open Graph / Twitter Card) metadata derived from the content.

#### Scenario: Unique metadata per page
- **WHEN** an event, venue, organiser, or blog page is rendered
- **THEN** the system SHALL emit a unique title, meta description, and social-sharing tags for that page

### Requirement: Structured data
The site SHALL emit schema.org structured data: Event for events, Place for venues, Organization for organisers, and BlogPosting for blog posts.

#### Scenario: Event structured data
- **WHEN** an event page is rendered
- **THEN** the system SHALL include schema.org Event structured data containing the event's name, start date, location, and organizer

### Requirement: Sitemap and crawler directives
The site SHALL publish an up-to-date XML sitemap and a robots directive, and SHALL allow indexing of public content while excluding the backend.

#### Scenario: Sitemap reflects content
- **WHEN** content is published
- **THEN** the system SHALL include its canonical URL in the XML sitemap

#### Scenario: Backend excluded from indexing
- **WHEN** a crawler requests crawl directives
- **THEN** the system SHALL disallow indexing of backend/admin routes

### Requirement: Performance budget
Public pages SHALL meet a performance budget targeting good Core Web Vitals (e.g., LCP, CLS, INP) on a typical mobile connection, leveraging caching, image optimization, and minimal blocking resources.

#### Scenario: Fast public pages
- **WHEN** a public page is loaded on a typical mobile connection
- **THEN** the system SHALL render within the defined performance budget for LCP and remain within the CLS threshold

### Requirement: GEO / AI-search findability
The site SHALL present clean, semantic, machine-readable content (semantic HTML, structured data, and a stable content structure) so that AI/generative search engines can accurately extract and cite event, venue, and organiser information.

#### Scenario: Machine-readable content
- **WHEN** an automated agent or AI crawler reads a content page
- **THEN** the system SHALL expose the key facts (what, when, where, who) in semantic HTML and structured data rather than only in non-semantic markup
