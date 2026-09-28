## MODIFIED Requirements

### Requirement: Managing an event's dates
The backend event create and edit forms SHALL let an authorized user give an event further dates beyond its start, each with its own time, and remove them again. Where the event has an end, the forms SHALL show beside each further date the end that date will receive, so that an editor can see it before saving. The forms SHALL make explicit that an event either repeats on an interval or carries a list of dates, and SHALL NOT allow saving both. The forms SHALL reject a date that cannot be read as a date and time, SHALL collapse a date entered twice, and SHALL refuse more dates than the system permits for one event. The date list SHALL be preserved when an event is saved from a form or path that does not present it, including the approval queue and calendar import. The public event submission form SHALL continue to accept a single date, and SHALL NOT accept a list.

#### Scenario: Adding and removing dates
- **WHEN** an authorized user adds further dates on the event create or edit form and saves
- **THEN** the system SHALL persist those dates with the event, and removing one and saving SHALL persist the remaining dates

#### Scenario: Choosing between repeating and listed dates
- **WHEN** an authorized user gives an event both a recurrence and further dates
- **THEN** the form SHALL refuse the save and SHALL report that an event either repeats or lists its dates

#### Scenario: Invalid, repeated, or too many dates
- **WHEN** a submitted date cannot be read, repeats a date already given, or exceeds the permitted number of dates
- **THEN** the system SHALL reject the save and report why, or collapse the repeated date, and SHALL NOT store a malformed list

#### Scenario: A save that does not show the dates keeps them
- **WHEN** an event carrying further dates is saved from a path that does not present them, such as approving it in the queue or a calendar synchronisation adopting it
- **THEN** the system SHALL leave its dates intact

#### Scenario: Public submissions carry one date
- **WHEN** a visitor submits an event through the public form
- **THEN** the form SHALL accept one date, and a submission carrying a list of dates SHALL NOT have that list stored

#### Scenario: Seeing the end a date will receive
- **WHEN** an authorized user enters a further date on an event that has an end
- **THEN** the form SHALL show the end that date will receive, derived from the first occurrence's duration, and SHALL update it when the event's start or end or that date changes

#### Scenario: No end to show
- **WHEN** the event has no end, or a further date has not been filled in
- **THEN** the form SHALL show no end for that date
