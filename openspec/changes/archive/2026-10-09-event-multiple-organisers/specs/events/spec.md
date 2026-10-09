## MODIFIED Requirements

### Requirement: Event entity and fields
The system SHALL represent an Event with a title, rich description, start date and time, optional end date and time, an optional Venue, zero or more Organisers, and an optional featured image. Where a Venue or an Organiser is given, it SHALL be a record chosen from the pre-populated list of existing records, not entered as free text. An Event's Organisers SHALL be equal, with none of them its main organiser; the system SHALL NOT hold the same Organiser twice for one event, and SHALL present them in order of name. An Event SHALL be valid with neither a Venue nor an Organiser, and every surface that presents an Event SHALL omit what is absent rather than presenting an empty or placeholder reference.

An Event MAY additionally carry a list of further dates on which the same event takes place, for series whose dates follow no regular interval. Each listed date SHALL carry its own time. Where an event has an end date and time, each date's end SHALL be that occurrence's start plus the duration between the event's own start and end, so that every occurrence lasts as long as the first. The system SHALL hold the dates in chronological order, SHALL NOT hold the same date twice, and SHALL bound how many dates one event may carry. An event carrying no such list SHALL behave exactly as an event with a single date.

#### Scenario: Creating a valid event
- **WHEN** an editor provides a title, description, and start date/time
- **THEN** the system SHALL persist the event, with the Venue and the Organisers it selected if any

#### Scenario: An event without a location or organiser
- **WHEN** an event carrying neither a Venue nor an Organiser is presented, in a listing, on its page, in its share card, or in its structured data
- **THEN** the system SHALL present the event without a location or organiser, and SHALL NOT render an empty block, a placeholder name, or a broken link

#### Scenario: Clearing a reference that was set
- **WHEN** an editor removes the Venue, or one or all of the Organisers, from an event that had them and saves
- **THEN** the system SHALL persist the event without what was removed

#### Scenario: An event on several irregular dates
- **WHEN** an editor gives an event further dates beyond its start
- **THEN** the system SHALL persist them with the event, in chronological order and without duplicates

#### Scenario: Each date lasts as long as the first
- **WHEN** an event with an end date and time takes place on a further date
- **THEN** that occurrence's end SHALL be its own start plus the duration of the event's first occurrence

#### Scenario: An event with no further dates is unaffected
- **WHEN** an event carries no list of further dates
- **THEN** the system SHALL present it exactly as it presents a single-date event

#### Scenario: An event with several organisers
- **WHEN** an editor selects more than one Organiser for an event and saves
- **THEN** the system SHALL persist every selected Organiser with the event, and every surface that presents the event's organisers SHALL present all of them, in order of name

#### Scenario: Events stored before several organisers were possible
- **WHEN** the system reads an event stored with a single Organiser before this change
- **THEN** it SHALL present that event with that one Organiser, without the event having to be converted or saved again

### Requirement: Venue and Organiser selection from drop-down lists
The Event editor SHALL present the Venue as a drop-down selector and the Organisers as a selector that accepts several choices, each populated from existing Venue or Organiser records and ordered by name. The Venue selector SHALL offer an explicit choice meaning "no location"; the Organiser selector SHALL accept no choice at all, meaning "no organiser". Neither SHALL accept a value that is not one of the listed records.

#### Scenario: Selecting from pre-input lists
- **WHEN** an editor opens the Venue or Organiser selector on the event form
- **THEN** the system SHALL list all existing Venues / Organisers for selection and SHALL NOT allow saving an unlisted free-text value

#### Scenario: Choosing no location or no organiser
- **WHEN** an editor chooses the "no location" option, or selects no Organiser, and saves
- **THEN** the system SHALL persist the event without that reference, and SHALL NOT reject the save

#### Scenario: Selecting several organisers
- **WHEN** an editor selects two or more Organisers on the event form and saves
- **THEN** the system SHALL persist all of them, and reopening the form SHALL show all of them selected

### Requirement: Listing display variants
The system SHALL provide event listings in at least three variants: one that includes each event's featured image, one that is text-only (without images), and a table. The table SHALL show, for each occurrence, its date, its time (with the end time when the event has one), the event title linking to the event, the location linking to the Venue, each of its organisers linking to that Organiser, and how often the event repeats when it does. The table SHALL identify its columns to assistive technology. On narrow screens each table row SHALL be presented as a stacked block that keeps every field, rather than dropping columns or requiring horizontal scrolling.

#### Scenario: Image and text-only variants
- **WHEN** a listing is requested in the image variant or the text-only variant
- **THEN** the system SHALL render the corresponding layout for the same underlying set of upcoming events

#### Scenario: Table variant
- **WHEN** a listing is requested in the table variant
- **THEN** the system SHALL render one row per occurrence with date, time, event, location, organiser, and repetition, with the event, location, and each organiser linking to their pages

#### Scenario: Table on a narrow screen
- **WHEN** the table variant is shown on a phone-width screen
- **THEN** each row SHALL stack its fields vertically, every field SHALL remain visible, and the page SHALL NOT scroll horizontally

### Requirement: Single event view
The system SHALL provide a dedicated, linkable page for each event showing its full description, date/time, featured image, and links to its Venue page and to the page of each of its Organisers.

Where an event takes place on several dates, its page SHALL present the next date at or after the current day, SHALL also present the event's other dates, and SHALL mark those that have passed as past rather than omitting them. When every date has passed, the page SHALL present the last of them. A visitor SHALL be able to link to one date of the event; the page SHALL then present that date, and the event's canonical URL SHALL remain the one without a date.

Where what an event page presents depends on the current day — such as which
occurrence of a recurring event is next — the page SHALL reflect the day it is
read, not the day it was generated. This SHALL hold however the page is delivered,
including from a cache, and SHALL NOT depend on the system having been redeployed.
The value SHALL be present in the page as delivered, so that a client which
executes no scripts sees the same occurrence a visitor does.

An event page SHALL NOT present as upcoming an occurrence that has already passed.

Where an occurrence has an end, the page SHALL show its end time alongside its start, both for the occurrence it presents and for each of the other dates it lists. An occurrence without an end SHALL show its start alone, with no placeholder.

The structured data an event page publishes SHALL describe the occurrence the page presents, with that occurrence's own start and end.

#### Scenario: Viewing one event
- **WHEN** a visitor opens an event's page
- **THEN** the system SHALL display the full event details and links to the associated Venue and to every associated Organiser

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

#### Scenario: The page shows when an occurrence ends
- **WHEN** a visitor opens the page of an event whose presented occurrence has an end
- **THEN** the page SHALL show that occurrence's start and end time

#### Scenario: The other dates show when they end
- **WHEN** a visitor opens the page of a series whose event has an end
- **THEN** each listed date SHALL show its start and its end time

#### Scenario: An occurrence without an end
- **WHEN** the presented occurrence has no end
- **THEN** the page SHALL show its start time alone, as it does today

#### Scenario: Structured data names every organiser
- **WHEN** an event with several Organisers publishes its structured data
- **THEN** the structured data SHALL name every one of them as an organizer
