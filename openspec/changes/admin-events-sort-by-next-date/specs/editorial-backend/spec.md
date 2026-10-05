## ADDED Requirements

### Requirement: Events are listed by their next date
In the management list of Events, the date an event is ordered by and shown with SHALL be its next occurrence on or after the current day, taken from its start, its further dates and its recurrence rule — the same occurrence its public page would present. An event with no occurrence on or after the current day SHALL use the date its public page presents (the last date of a date series, otherwise its start). Sorting by date and the default order of the Events list SHALL use this date.

#### Scenario: A repeating event sorts by its next occurrence
- **WHEN** an Administrator views the Events list, ordered by date, and a weekly event that started in January has its next occurrence on Thursday
- **THEN** that event SHALL be placed by Thursday's date and its Datum cell SHALL show Thursday's date with its recurrence label

#### Scenario: An event with further dates
- **WHEN** an event's first date has passed but one of its further dates is still to come
- **THEN** the list SHALL order and show the event by that coming date

#### Scenario: A past event
- **WHEN** an event has no occurrence on or after the current day
- **THEN** the list SHALL order and show it by the date its public page presents
