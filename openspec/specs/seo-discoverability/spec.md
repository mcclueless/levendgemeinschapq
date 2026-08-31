# seo-discoverability Specification

## Purpose

Defines discoverability for the public site: per-page metadata and social-sharing tags, schema.org structured data, sitemap and crawler directives, a performance budget, and GEO / AI-search findability.

## Requirements

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

### Requirement: Event share previews carry when, where and what

An event page SHALL provide social-sharing metadata sufficient for a messaging or
social client to present the event's date, time, recurrence, venue and summary
without the reader opening the link.

The social description SHALL lead with the event's date, followed by its time,
followed by a description of its recurrence when the event repeats, followed by the
event's summary text. Because clients truncate a description after a short,
client-determined length, the system SHALL place these elements in that order so
that the summary is the element lost to truncation.

The social title SHALL carry the event's title together with its venue name.

Any element whose source value is absent SHALL be omitted together with its
separator, leaving the remaining elements correctly punctuated.

#### Scenario: Recurring event's share description

- **WHEN** a recurring event's page is rendered
- **THEN** the social description SHALL begin with the event's date and time,
  SHALL then state how often the event repeats, and SHALL then carry the event's
  summary text

#### Scenario: Non-recurring event's share description

- **WHEN** a non-recurring event's page is rendered
- **THEN** the social description SHALL begin with the event's date and time,
  SHALL contain no recurrence statement, and SHALL then carry the event's summary
  text

#### Scenario: Share title carries the venue

- **WHEN** an event with a venue is rendered
- **THEN** the social title SHALL contain both the event's title and its venue name

#### Scenario: Event without a venue

- **WHEN** an event that has no venue is rendered
- **THEN** the social title SHALL be the event's title alone, with no trailing
  separator

#### Scenario: Event without summary text

- **WHEN** an event that has no summary text is rendered
- **THEN** the social description SHALL carry the date, time and recurrence
  elements alone, with no trailing separator

### Requirement: A share preview's date matches the page it opens

The date carried in an event's social-sharing metadata SHALL be the same occurrence
the event's own page presents to a visitor, so that a shared preview never
advertises a date that differs from the page reached by following it.

#### Scenario: Recurring event whose stored start has passed

- **WHEN** a recurring event whose stored start is in the past, but which still
  recurs, is rendered
- **THEN** the date in its social-sharing metadata SHALL be the same upcoming
  occurrence shown on the event's page, and SHALL NOT be the past stored start

### Requirement: Social image dimensions are declared

Social-sharing metadata SHALL declare the intended width and height of the sharing
image alongside its URL, so that a client can present a large preview card rather
than selecting a small thumbnail on its own.

#### Scenario: Page with a sharing image

- **WHEN** a page that carries a social-sharing image is rendered
- **THEN** the system SHALL emit the image's declared width and height together
  with its URL
