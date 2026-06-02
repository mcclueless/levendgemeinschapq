# calendar-import Specification

## Purpose

Defines importing events from a Google Calendar / iCal URL: fetch and validation, field mapping, RRULE recurrence handling, deduplication by calendar UID, and routing imports into the approval queue.

## Requirements

### Requirement: Import events from Google Calendar or iCal link
The backend SHALL allow an editor to import events by providing a Google Calendar or iCal (.ics) URL. The system SHALL fetch the calendar and create Event records from its entries.

#### Scenario: Importing from an iCal URL
- **WHEN** an editor submits a valid iCal or Google Calendar URL
- **THEN** the system SHALL fetch the feed and create Event records from its VEVENT entries

#### Scenario: Invalid or unreachable feed
- **WHEN** the provided URL is unreachable or not a valid calendar feed
- **THEN** the system SHALL report the failure and SHALL NOT create partial or malformed events

### Requirement: Field mapping
The system SHALL map calendar fields to Event fields: summary to title, description to description, start/end to date and time, and location to a venue hint.

#### Scenario: Mapping standard fields
- **WHEN** a calendar entry with summary, description, start, end, and location is imported
- **THEN** the system SHALL populate the corresponding Event fields from those values

#### Scenario: Unmatched venue or organiser
- **WHEN** an imported entry's location does not match an existing Venue
- **THEN** the system SHALL flag the imported event for an editor to assign a Venue and Organiser before publication

### Requirement: Recurrence import
The system SHALL interpret calendar recurrence rules (RRULE) so that recurring calendar entries are imported as repeatable events.

#### Scenario: Recurring entry imported as repeatable
- **WHEN** a calendar entry carries an RRULE for weekly or monthly recurrence
- **THEN** the system SHALL create a repeatable event reflecting that recurrence

### Requirement: Deduplication and review queue
Imported events SHALL be deduplicated against existing events by calendar UID, and imported items SHALL enter the approval queue rather than publishing automatically.

#### Scenario: Re-importing the same feed
- **WHEN** a feed is imported again and contains entries already imported
- **THEN** the system SHALL update or skip the existing events rather than creating duplicates

#### Scenario: Imports await approval
- **WHEN** events are imported from a feed
- **THEN** the system SHALL place them in the approval queue in an unpublished state
