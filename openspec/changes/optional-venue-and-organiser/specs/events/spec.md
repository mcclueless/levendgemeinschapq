## MODIFIED Requirements

### Requirement: Event entity and fields
The system SHALL represent an Event with a title, rich description, start date and time, optional end date and time, an optional Venue, an optional Organiser, and an optional featured image. Where a Venue or an Organiser is given, it SHALL be one record chosen from the pre-populated list of existing records, not entered as free text. An Event SHALL be valid with neither, and every surface that presents an Event SHALL omit what is absent rather than presenting an empty or placeholder reference.

#### Scenario: Creating a valid event
- **WHEN** an editor provides a title, description, and start date/time
- **THEN** the system SHALL persist the event, with the Venue and Organiser it selected if any

#### Scenario: An event without a location or organiser
- **WHEN** an event carrying neither a Venue nor an Organiser is presented, in a listing, on its page, in its share card, or in its structured data
- **THEN** the system SHALL present the event without a location or organiser, and SHALL NOT render an empty block, a placeholder name, or a broken link

#### Scenario: Clearing a reference that was set
- **WHEN** an editor removes the Venue or the Organiser from an event that had one and saves
- **THEN** the system SHALL persist the event without it

### Requirement: Venue and Organiser selection from drop-down lists
The Event editor SHALL present the Venue and Organiser as drop-down selectors populated from existing Venue and Organiser records, ordered by name. Each selector SHALL offer an explicit choice meaning "no location" or "no organiser", and SHALL NOT accept a value that is not one of the listed records.

#### Scenario: Selecting from pre-input lists
- **WHEN** an editor opens the Venue or Organiser selector on the event form
- **THEN** the system SHALL list all existing Venues / Organisers for selection and SHALL NOT allow saving an unlisted free-text value

#### Scenario: Choosing no location or no organiser
- **WHEN** an editor chooses the "no location" or "no organiser" option and saves
- **THEN** the system SHALL persist the event without that reference, and SHALL NOT reject the save
