## MODIFIED Requirements

### Requirement: Single event view
The system SHALL provide a dedicated, linkable page for each event showing its full description, date/time, featured image, and links to its Venue and Organiser pages.

Where what an event page presents depends on the current day — such as which
occurrence of a recurring event is next — the page SHALL reflect the day it is
read, not the day it was generated. This SHALL hold however the page is delivered,
including from a cache, and SHALL NOT depend on the system having been redeployed.
The value SHALL be present in the page as delivered, so that a client which
executes no scripts sees the same occurrence a visitor does.

An event page SHALL NOT present as upcoming an occurrence that has already passed.

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
