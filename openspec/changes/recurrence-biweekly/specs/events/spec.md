## MODIFIED Requirements

### Requirement: Repeatable (recurring) events
An editor SHALL be able to mark an event as repeatable on a recurrence interval (at minimum: weekly, every two weeks and monthly). When an event is marked repeatable, the system SHALL require a recurrence end date and SHALL NOT persist a newly authored recurrence without one. A repeatable event SHALL surface as an upcoming occurrence for each future date implied by its recurrence, up to and including its recurrence end date, except where it is set to be summarised by its next occurrence. A recurrence that carries no end date — because it predates this requirement or arrived through calendar import — SHALL remain valid and SHALL be treated as open-ended. The recurrence end date SHALL be distinct from the event's optional end date and time, which bounds a single occurrence.

An event SHALL NOT carry both a recurrence and a list of further dates: an event either repeats on an interval or names its dates. The editorial forms SHALL make the choice explicit, and SHALL NOT allow saving both.

A repeatable event MAY be set to be summarised in listings by its next
occurrence alone. Such an event SHALL contribute exactly one entry to an
upcoming-events listing instead of one per occurrence, and SHALL otherwise
remain an ordinary repeatable event: its stored recurrence, its own page, and
every other presentation of its series SHALL be unaffected by the setting. The
setting SHALL be off unless an editor has chosen it, so an event stored or
imported without it SHALL continue to surface every occurrence. The setting
SHALL apply to a recurrence only; an event that names its dates SHALL
contribute one entry per listed date regardless of it.

Wherever the system describes a recurrence to a reader, that description SHALL
reflect the recurrence's interval as well as its frequency, so that an event
repeating every second week is not described as repeating every week. The system
SHALL use one consistent description of a given recurrence everywhere it appears,
including the public event page, the editorial review queue, and event
social-sharing metadata.

#### Scenario: Weekly recurrence appears each week
- **WHEN** an event is marked to repeat weekly
- **THEN** the system SHALL present the next future occurrence in upcoming-event listings as each prior occurrence passes

#### Scenario: A recurrence every two weeks appears every other week
- **WHEN** an editor marks an event as repeating every two weeks with a recurrence end date
- **THEN** the system SHALL present an occurrence every fourteen days from the start up to and including the end date, SHALL NOT present the weeks in between, and SHALL describe the event as repeating every two weeks wherever it describes the recurrence

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

#### Scenario: A summarised recurrence is listed once
- **WHEN** a repeatable event set to be summarised by its next occurrence has several future occurrences within a listing's range
- **THEN** the listing SHALL show exactly one entry for that event, at its next occurrence, and SHALL NOT show its later occurrences

#### Scenario: A recurrence without the setting is listed in full
- **WHEN** a repeatable event has not been set to be summarised by its next occurrence
- **THEN** the system SHALL list one entry per future occurrence in range, exactly as before this requirement

#### Scenario: The setting does not reach a date series
- **WHEN** an event names further dates rather than repeating on an interval
- **THEN** the system SHALL list one entry per listed date in range, and the setting SHALL have no effect on it

#### Scenario: A summarised event keeps its full series on its own page
- **WHEN** a visitor opens the page of an event set to be summarised by its next occurrence
- **THEN** the page SHALL present the event's recurrence exactly as it does for any repeatable event, and SHALL honour a request for a particular occurrence's date
