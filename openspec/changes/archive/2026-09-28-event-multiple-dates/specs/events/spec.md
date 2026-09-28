## MODIFIED Requirements

### Requirement: Event entity and fields
The system SHALL represent an Event with a title, rich description, start date and time, optional end date and time, an optional Venue, an optional Organiser, and an optional featured image. Where a Venue or an Organiser is given, it SHALL be one record chosen from the pre-populated list of existing records, not entered as free text. An Event SHALL be valid with neither, and every surface that presents an Event SHALL omit what is absent rather than presenting an empty or placeholder reference.

An Event MAY additionally carry a list of further dates on which the same event takes place, for series whose dates follow no regular interval. Each listed date SHALL carry its own time. Where an event has an end date and time, each date's end SHALL be that occurrence's start plus the duration between the event's own start and end, so that every occurrence lasts as long as the first. The system SHALL hold the dates in chronological order, SHALL NOT hold the same date twice, and SHALL bound how many dates one event may carry. An event carrying no such list SHALL behave exactly as an event with a single date.

#### Scenario: Creating a valid event
- **WHEN** an editor provides a title, description, and start date/time
- **THEN** the system SHALL persist the event, with the Venue and Organiser it selected if any

#### Scenario: An event without a location or organiser
- **WHEN** an event carrying neither a Venue nor an Organiser is presented, in a listing, on its page, in its share card, or in its structured data
- **THEN** the system SHALL present the event without a location or organiser, and SHALL NOT render an empty block, a placeholder name, or a broken link

#### Scenario: Clearing a reference that was set
- **WHEN** an editor removes the Venue or the Organiser from an event that had one and saves
- **THEN** the system SHALL persist the event without it

#### Scenario: An event on several irregular dates
- **WHEN** an editor gives an event further dates beyond its start
- **THEN** the system SHALL persist them with the event, in chronological order and without duplicates

#### Scenario: Each date lasts as long as the first
- **WHEN** an event with an end date and time takes place on a further date
- **THEN** that occurrence's end SHALL be its own start plus the duration of the event's first occurrence

#### Scenario: An event with no further dates is unaffected
- **WHEN** an event carries no list of further dates
- **THEN** the system SHALL present it exactly as it presents a single-date event

### Requirement: Repeatable (recurring) events
An editor SHALL be able to mark an event as repeatable on a recurrence interval (at minimum: weekly and monthly). When an event is marked repeatable, the system SHALL require a recurrence end date and SHALL NOT persist a newly authored recurrence without one. A repeatable event SHALL surface as an upcoming occurrence for each future date implied by its recurrence, up to and including its recurrence end date. A recurrence that carries no end date — because it predates this requirement or arrived through calendar import — SHALL remain valid and SHALL be treated as open-ended. The recurrence end date SHALL be distinct from the event's optional end date and time, which bounds a single occurrence.

An event SHALL NOT carry both a recurrence and a list of further dates: an event either repeats on an interval or names its dates. The editorial forms SHALL make the choice explicit, and SHALL NOT allow saving both.

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

#### Scenario: A repeat rule and a date list are mutually exclusive
- **WHEN** an editor gives an event a recurrence while it carries further dates, or further dates while it carries a recurrence
- **THEN** the system SHALL require the editor to choose one, and SHALL NOT persist both

### Requirement: Upcoming-only listing with limit and "See more"
The system SHALL provide reusable event listings that show only events occurring today or in the future, ordered by soonest start first. A listing SHALL accept a configurable maximum number of events, and when more upcoming events exist than the limit, SHALL display a "See more…" affordance linking to the full list. An event carrying further dates SHALL contribute one occurrence per date that falls in the listed range, each ordered by its own date, and a listing entry SHALL link to that occurrence's date on the event's page.

#### Scenario: Past events excluded
- **WHEN** an upcoming-events listing is rendered
- **THEN** the system SHALL exclude events whose occurrence is before the current day and SHALL order the remaining events by soonest first

#### Scenario: Limit and See more
- **WHEN** a listing is configured with a limit of N and more than N upcoming events exist
- **THEN** the system SHALL render at most N events and SHALL show a "See more…" link to the complete listing

#### Scenario: Every date of a series is listed
- **WHEN** an event carries further dates and several of them fall within a listing's range
- **THEN** the listing SHALL show one entry per such date, ordered among the other events by date

#### Scenario: A date that has passed leaves the listing
- **WHEN** one date of a series is before the current day and later dates are not
- **THEN** the listing SHALL omit the date that has passed and SHALL still show the later ones

### Requirement: Single event view
The system SHALL provide a dedicated, linkable page for each event showing its full description, date/time, featured image, and links to its Venue and Organiser pages.

Where an event takes place on several dates, its page SHALL present the next date at or after the current day, SHALL also present the event's other dates, and SHALL mark those that have passed as past rather than omitting them. When every date has passed, the page SHALL present the last of them. A visitor SHALL be able to link to one date of the event; the page SHALL then present that date, and the event's canonical URL SHALL remain the one without a date.

Where what an event page presents depends on the current day — such as which
occurrence of a recurring event is next — the page SHALL reflect the day it is
read, not the day it was generated. This SHALL hold however the page is delivered,
including from a cache, and SHALL NOT depend on the system having been redeployed.
The value SHALL be present in the page as delivered, so that a client which
executes no scripts sees the same occurrence a visitor does.

An event page SHALL NOT present as upcoming an occurrence that has already passed.

The structured data an event page publishes SHALL describe the occurrence the page presents, with that occurrence's own start and end.

#### Scenario: Viewing one event
- **WHEN** a visitor opens an event's page
- **THEN** the system SHALL display the full event details and links to the associated Venue and Organiser

#### Scenario: A recurring event's page after its occurrence passes

- **WHEN** a visitor opens a recurring event's page on a day after the occurrence
  the page previously presented, and the system has not been redeployed in between
- **THEN** the page SHALL present the next occurrence at or after the current day,
  and SHALL NOT present the occurrence that has passed

#### Scenario: The page and its listing agree

- **WHEN** a recurring event appears in an upcoming-event listing and a visitor
  opens its page from that listing
- **THEN** both SHALL name the same occurrence

#### Scenario: The occurrence is present without scripting

- **WHEN** a client that executes no scripts retrieves an event page
- **THEN** the occurrence it receives SHALL be the same one a visitor sees, so that
  metadata derived from it is correct

#### Scenario: A series shows its other dates
- **WHEN** a visitor opens the page of an event that takes place on several dates
- **THEN** the page SHALL present the next date still to come, SHALL list the event's other dates, and SHALL mark any that have passed as past

#### Scenario: Linking to one date
- **WHEN** a visitor opens an event page with a specific date of that event requested
- **THEN** the page SHALL present that date, and its canonical URL SHALL be the event's URL without the date

#### Scenario: A requested date the event does not have
- **WHEN** the requested date is not one of the event's dates
- **THEN** the page SHALL present the next date at or after the current day, as though none had been requested

#### Scenario: Every date has passed
- **WHEN** a visitor opens the page of a series whose dates have all passed
- **THEN** the page SHALL present the last date and SHALL NOT present it as upcoming

#### Scenario: Structured data matches the occurrence shown
- **WHEN** an event page presents an occurrence
- **THEN** the structured data it publishes SHALL carry that occurrence's start and its own end, not those of a different occurrence
