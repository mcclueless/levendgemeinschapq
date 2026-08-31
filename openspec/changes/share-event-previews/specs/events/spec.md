## MODIFIED Requirements

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
