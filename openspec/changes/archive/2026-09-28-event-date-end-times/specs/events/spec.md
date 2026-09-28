## MODIFIED Requirements

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

Where an occurrence has an end, the page SHALL show its end time alongside its start, both for the occurrence it presents and for each of the other dates it lists. An occurrence without an end SHALL show its start alone, with no placeholder.

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

#### Scenario: The page shows when an occurrence ends
- **WHEN** a visitor opens the page of an event whose presented occurrence has an end
- **THEN** the page SHALL show that occurrence's start and end time

#### Scenario: The other dates show when they end
- **WHEN** a visitor opens the page of a series whose event has an end
- **THEN** each listed date SHALL show its start and its end time

#### Scenario: An occurrence without an end
- **WHEN** the presented occurrence has no end
- **THEN** the page SHALL show its start time alone, as it does today
