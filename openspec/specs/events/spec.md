# events Specification

## Purpose

Defines the Event content type and its public presentation: event fields and required Venue/Organiser relationships, featured images, recurring events, reusable upcoming-only listings (with limits, variants, and embedding), and the single event page.

## Requirements

### Requirement: Event entity and fields
The system SHALL represent an Event with a title, rich description, start date and time, optional end date and time, exactly one Venue, exactly one Organiser, and an optional featured image. The Venue and Organiser SHALL be chosen from pre-populated lists of existing Venue and Organiser records, not entered as free text.

#### Scenario: Creating a valid event
- **WHEN** an editor provides a title, description, start date/time, a Venue selected from the list, and an Organiser selected from the list
- **THEN** the system SHALL persist the event and link it to the selected Venue and Organiser records

#### Scenario: Missing required relationship
- **WHEN** an editor attempts to save an event without selecting a Venue or without selecting an Organiser
- **THEN** the system SHALL reject the save and report which required field is missing

### Requirement: Venue and Organiser selection from drop-down lists
The Event editor SHALL present the Venue and Organiser as drop-down selectors populated from existing Venue and Organiser records, ordered by name.

#### Scenario: Selecting from pre-input lists
- **WHEN** an editor opens the Venue or Organiser selector on the event form
- **THEN** the system SHALL list all existing Venues / Organisers for selection and SHALL NOT allow saving an unlisted free-text value

### Requirement: Featured image and thumbnail
An Event MAY have a featured image. When present, the featured image SHALL appear on the single event view and SHALL be usable as the event's thumbnail in listings.

#### Scenario: Featured image used as thumbnail
- **WHEN** an event with a featured image is shown in an image-bearing list
- **THEN** the system SHALL display the featured image as the event's thumbnail

#### Scenario: Event without a featured image
- **WHEN** an event without a featured image is shown in an image-bearing list
- **THEN** the system SHALL render a graceful fallback (placeholder or text-only entry) without layout breakage

### Requirement: Repeatable (recurring) events
An editor SHALL be able to mark an event as repeatable on a recurrence interval (at minimum: weekly and monthly). When an event is marked repeatable, the system SHALL require a recurrence end date and SHALL NOT persist a newly authored recurrence without one. A repeatable event SHALL surface as an upcoming occurrence for each future date implied by its recurrence, up to and including its recurrence end date. A recurrence that carries no end date — because it predates this requirement or arrived through calendar import — SHALL remain valid and SHALL be treated as open-ended. The recurrence end date SHALL be distinct from the event's optional end date and time, which bounds a single occurrence.

Wherever the system describes a recurrence to a reader, that description SHALL
reflect the recurrence's interval as well as its frequency, so that an event
repeating every second week is not described as repeating every week. The system
SHALL use one consistent description of a given recurrence everywhere it appears,
including the public event page, the editorial review queue, and event
social-sharing metadata.

#### Scenario: Weekly recurrence appears each week
- **WHEN** an event is marked to repeat weekly
- **THEN** the system SHALL present the next future occurrence in upcoming-event listings as each prior occurrence passes

#### Scenario: Ending recurrence
- **WHEN** a repeatable event has a recurrence end date that is in the past
- **THEN** the system SHALL stop presenting future occurrences for that event

#### Scenario: Setting a recurrence end date
- **WHEN** an editor marks an event as repeating and supplies a recurrence end date
- **THEN** the system SHALL persist that end date with the event's recurrence and SHALL NOT present occurrences falling after it

#### Scenario: Occurrence on the end date is included
- **WHEN** a repeatable event's recurrence produces an occurrence falling on the recurrence end date itself
- **THEN** the system SHALL present that occurrence

#### Scenario: Recurrence end date omitted
- **WHEN** an editor marks an event as repeating and does not supply a recurrence end date
- **THEN** the system SHALL reject the save, SHALL report that a recurrence end date is required, and SHALL NOT persist the event

#### Scenario: Recurrence end date before the start
- **WHEN** an editor supplies a recurrence end date earlier than the event's start date
- **THEN** the system SHALL reject the save, SHALL report the invalid recurrence end date, and SHALL NOT persist the event

#### Scenario: Existing open-ended recurrence keeps working
- **WHEN** an event stored before this requirement, or imported from a calendar rule with no end, repeats with no recurrence end date
- **THEN** the system SHALL continue to treat it as a valid open-ended recurrence and SHALL continue presenting its future occurrences

#### Scenario: Recurrence end date is not the event's end time
- **WHEN** a repeatable event has both an end date and time for a single occurrence and a recurrence end date
- **THEN** the system SHALL treat the end date and time as the finish of one occurrence and the recurrence end date as the last day on which the series may repeat

#### Scenario: End date supplied without a recurrence interval
- **WHEN** an editor supplies a recurrence end date but marks the event as non-repeating
- **THEN** the system SHALL save the event as non-repeating, SHALL NOT persist a recurrence end date, and SHALL NOT report an error

#### Scenario: A multi-interval recurrence is described by its interval
- **WHEN** an event repeats on an interval greater than one, such as every second week
- **THEN** every description of that recurrence the system presents SHALL convey the interval, and SHALL NOT describe the event as repeating on the underlying frequency alone

#### Scenario: One recurrence vocabulary across surfaces
- **WHEN** the same recurring event is presented on its public page, in the editorial review queue, and in its social-sharing metadata
- **THEN** the interval phrase SHALL be worded identically on all three, and an editorial surface MAY additionally state the end of the series, which reader-facing surfaces omit

### Requirement: Upcoming-only listing with limit and "See more"
The system SHALL provide reusable event listings that show only events occurring today or in the future, ordered by soonest start first. A listing SHALL accept a configurable maximum number of events, and when more upcoming events exist than the limit, SHALL display a "See more…" affordance linking to the full list.

#### Scenario: Past events excluded
- **WHEN** an upcoming-events listing is rendered
- **THEN** the system SHALL exclude events whose occurrence is before the current day and SHALL order the remaining events by soonest first

#### Scenario: Limit and See more
- **WHEN** a listing is configured with a limit of N and more than N upcoming events exist
- **THEN** the system SHALL render at most N events and SHALL show a "See more…" link to the complete listing

### Requirement: Listing display variants
The system SHALL provide event listings in at least two variants: one that includes each event's featured image and one that is text-only (without images).

#### Scenario: Image and text-only variants
- **WHEN** a listing is requested in the image variant or the text-only variant
- **THEN** the system SHALL render the corresponding layout for the same underlying set of upcoming events

### Requirement: Embedding event listings across the site
Event listings SHALL be embeddable on static pages and on blog posts, and SHALL appear automatically at the bottom of Venue pages (events at that venue) and Organiser pages (events by that organiser).

#### Scenario: Listing embedded on a static page
- **WHEN** an editor embeds an event listing on a static page or blog post
- **THEN** the system SHALL render the upcoming-events listing inline within that page's content

#### Scenario: Listing on Venue and Organiser pages
- **WHEN** a Venue page or Organiser page is rendered
- **THEN** the system SHALL display that entity's upcoming events at the bottom of the page

### Requirement: Single event view
The system SHALL provide a dedicated, linkable page for each event showing its full description, date/time, featured image, and links to its Venue and Organiser pages.

#### Scenario: Viewing one event
- **WHEN** a visitor opens an event's page
- **THEN** the system SHALL display the full event details and links to the associated Venue and Organiser

### Requirement: Event social media links
An Event MAY have social media profile URLs for a curated set of platforms. The Event's public page SHALL render the platforms that are set as a row of icon links; platforms without a URL SHALL be omitted, and an Event with none SHALL show no social row.

#### Scenario: Event with social links
- **WHEN** a visitor views an Event that has one or more social media URLs
- **THEN** the page SHALL show an icon link for each set platform, opening the corresponding profile

#### Scenario: Event without social links
- **WHEN** a visitor views an Event with no social media URLs
- **THEN** no social media row SHALL be shown
