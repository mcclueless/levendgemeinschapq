## ADDED Requirements

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

## MODIFIED Requirements

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
