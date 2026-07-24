# calendar-import Specification

## Purpose

Defines importing events from a Google Calendar / iCal URL: fetch and validation, field mapping, RRULE recurrence handling, deduplication by calendar UID, and routing imports into the approval queue.
## Requirements
### Requirement: Import events from Google Calendar or iCal link
The backend SHALL allow an editor to save a Google Calendar or iCal (.ics) URL as a named feed, together with the default Venue and Organiser to apply to its entries. The system SHALL fetch a saved feed on demand and create Event records from its entries. A feed SHALL remain available after import so that it can be re-synchronised, edited, or deleted without re-entering its URL or defaults.

#### Scenario: Saving and importing a feed
- **WHEN** an editor saves a valid iCal or Google Calendar URL with its default Venue and Organiser
- **THEN** the system SHALL retain the feed and SHALL fetch it and create Event records from its VEVENT entries

#### Scenario: Feed persists after importing
- **WHEN** an import from a saved feed completes
- **THEN** the system SHALL still list that feed with its URL and defaults, ready to be synchronised again without re-entry

#### Scenario: Invalid or unreachable feed
- **WHEN** a feed's URL is unreachable or is not a valid calendar feed
- **THEN** the system SHALL report the failure, SHALL NOT create partial or malformed events, and SHALL retain the saved feed so the editor can correct it

### Requirement: Field mapping
The system SHALL map calendar fields to Event fields: summary to title, description to description, start/end to date and time, and location to a venue hint.

#### Scenario: Mapping standard fields
- **WHEN** a calendar entry with summary, description, start, end, and location is imported
- **THEN** the system SHALL populate the corresponding Event fields from those values

#### Scenario: Unmatched venue or organiser
- **WHEN** an imported entry's location does not match an existing Venue
- **THEN** the system SHALL flag the imported event for an editor to assign a Venue and Organiser before publication

### Requirement: Recurrence import
The system SHALL interpret calendar recurrence rules (RRULE) so that recurring
calendar entries are imported as repeatable events. When a recurring entry is
imported and its first occurrence is in the past, the system SHALL store the
event's start as the next occurrence at or after the current day, so that the
event presents an upcoming date rather than a historical one, while preserving
the entry's identity for de-duplication. When a recurring entry uses a rule the
system cannot express as a supported repeatable interval, and that rule has not
already ended, the system SHALL still import the entry as a pending event carrying
a note asking an editor to set its next date, rather than discarding it.

#### Scenario: Recurring entry imported as repeatable
- **WHEN** a calendar entry carries an RRULE for weekly or monthly recurrence
- **THEN** the system SHALL create a repeatable event reflecting that recurrence

#### Scenario: Recurring entry with a past start presents an upcoming date
- **WHEN** a recurring entry whose first occurrence is in the past, but which
  still recurs today or later, is imported
- **THEN** the created event's stored start SHALL be the next occurrence at or
  after the current day, and the entry SHALL still be recognised as the same entry
  when the feed is synchronised again

#### Scenario: Unexpressible but still-active recurrence is kept for review
- **WHEN** a recurring entry uses a rule the system cannot express as a supported
  interval, and the rule has not already ended
- **THEN** the system SHALL import it as a pending event with a note asking an
  editor to set its next date, rather than skipping it

### Requirement: Deduplication and review queue
Imported events SHALL be deduplicated against existing events by calendar UID, and imported items SHALL enter the approval queue rather than publishing automatically. When an entry's UID is already present on the site, the system SHALL skip it and SHALL NOT modify the existing event, so that editorial changes made after import are preserved.

#### Scenario: Re-synchronising the same feed
- **WHEN** a feed is synchronised again and contains entries already imported
- **THEN** the system SHALL skip those entries and SHALL NOT create duplicates

#### Scenario: Editorial changes survive re-synchronisation
- **WHEN** an editor has changed an imported event's venue, description, or cover image, and that event's feed is synchronised again
- **THEN** the system SHALL leave those changes intact

#### Scenario: Imports await approval
- **WHEN** events are imported from a feed
- **THEN** the system SHALL place them in the approval queue in an unpublished state

### Requirement: On-demand synchronisation of a saved feed
The system SHALL provide an explicit action to synchronise a saved feed, and an action to synchronise all saved feeds. Synchronisation SHALL NOT occur on a schedule or as a side effect of visitors viewing the site; it happens only when an authorized user asks for it.

#### Scenario: Synchronising picks up new entries
- **WHEN** an authorized user synchronises a saved feed whose source calendar has gained entries since the last synchronisation
- **THEN** the system SHALL create Event records for those entries and place them in the approval queue

#### Scenario: Synchronising a feed with nothing new
- **WHEN** an authorized user synchronises a feed whose entries are all already present
- **THEN** the system SHALL create no events, report that everything was skipped, and change nothing

#### Scenario: Synchronising every feed at once
- **WHEN** an authorized user synchronises all feeds
- **THEN** the system SHALL synchronise each saved feed and SHALL report the outcome without a failure in one feed preventing the others from running

### Requirement: Imported events record the feed they came from
An event created by synchronising a feed SHALL record which feed produced it. An event with no such record — including any event imported before this was tracked, and any event created by hand — SHALL remain valid, and SHALL NOT be treated as belonging to any feed.

#### Scenario: Newly imported event records its feed
- **WHEN** a feed synchronisation creates an event
- **THEN** the system SHALL record that feed as the event's origin

#### Scenario: Pre-existing imported events remain valid
- **WHEN** the system reads an imported event that carries a calendar UID but no feed origin
- **THEN** the system SHALL treat the event as valid and SHALL continue to display and list it

#### Scenario: Adopting a previously imported event
- **WHEN** a feed synchronisation encounters an existing event whose calendar UID appears in that feed and which has no recorded feed origin
- **THEN** the system SHALL record that feed as the event's origin and SHALL NOT change any other field of that event

### Requirement: Hiding events cancelled in the source feed
When a feed no longer lists an entry it previously produced, the system SHALL hide the corresponding event rather than continuing to show it, and SHALL NOT delete it. The system SHALL apply this only to events that originate from the feed being synchronised, only to events that have not yet occurred, and only when the feed was fetched successfully and returned at least one entry.

#### Scenario: Cancelled future event is hidden
- **WHEN** a feed is synchronised and a future event it previously produced is no longer listed in the feed
- **THEN** the system SHALL set that event to hidden and SHALL report that it did so

#### Scenario: Cancelled event is not deleted
- **WHEN** the system hides an event because the feed no longer lists it
- **THEN** the event SHALL remain in the backend and SHALL be restorable by an Administrator

#### Scenario: Past events are never hidden by synchronisation
- **WHEN** a feed publishes only upcoming entries and therefore no longer lists events that have already taken place
- **THEN** the system SHALL NOT hide those past events

#### Scenario: A failed or empty fetch hides nothing
- **WHEN** synchronising a feed fails, or the feed is fetched successfully but contains no entries
- **THEN** the system SHALL NOT hide any event, and SHALL report the failure or the empty result

#### Scenario: Other content is never hidden by synchronisation
- **WHEN** a feed is synchronised and the site contains events created by hand or produced by a different feed
- **THEN** the system SHALL NOT hide any of those events, even where a calendar UID matches

### Requirement: A feed records the outcome of its last synchronisation
Each saved feed SHALL record when it was last synchronised and what happened — how
many events were created, skipped as already present, skipped as past, hidden, and
flagged for review, or the reason the synchronisation failed. The backend SHALL
show this alongside the feed.

#### Scenario: Successful synchronisation is recorded
- **WHEN** a feed is synchronised successfully
- **THEN** the system SHALL record the time and the counts of created, skipped,
  skipped-as-past, hidden, and flagged events, and SHALL display them with the feed

#### Scenario: Failed synchronisation is recorded and visible
- **WHEN** synchronising a feed fails because its URL is unreachable or no longer
  valid
- **THEN** the system SHALL record the failure and its reason against that feed,
  and SHALL show it in the backend so the feed is not silently broken

### Requirement: Import is limited to current and future events
Synchronising a feed SHALL create events only for entries that are current or
still to come, and SHALL skip entries whose last possible occurrence is before
the current day. A non-recurring entry SHALL be skipped when its start is before
the current day. A recurring entry SHALL be skipped only when its recurrence has
an end that is before the current day; a recurring entry with no end SHALL be
treated as continuing into the indefinite future and SHALL NOT be skipped on the
basis of age. The current-day boundary SHALL be the same one the site's
upcoming-event listings use.

#### Scenario: Past one-off entry is skipped
- **WHEN** a feed is synchronised and it contains a non-recurring entry whose date
  is before the current day
- **THEN** the system SHALL NOT create an event for that entry and SHALL count it
  among the entries skipped as past

#### Scenario: Future one-off entry is imported
- **WHEN** a feed is synchronised and it contains a non-recurring entry dated
  today or later
- **THEN** the system SHALL create an event for that entry

#### Scenario: Ended recurrence is skipped
- **WHEN** a feed is synchronised and it contains a recurring entry whose
  recurrence end is before the current day
- **THEN** the system SHALL NOT create an event for that entry and SHALL count it
  among the entries skipped as past

#### Scenario: Open-ended recurrence that started in the past is imported
- **WHEN** a feed is synchronised and it contains a recurring entry whose first
  occurrence is in the past but whose recurrence has no end, or an end that is
  today or later
- **THEN** the system SHALL create an event for that entry

