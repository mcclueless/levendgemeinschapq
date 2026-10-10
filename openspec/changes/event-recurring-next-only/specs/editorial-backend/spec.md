## ADDED Requirements

### Requirement: Choosing to show a recurring event once
The event create and edit forms SHALL offer, within the recurrence control group, a single setting by which an editor asks that the event be summarised in listings by its next occurrence. The setting SHALL be off by default on the create form, and the edit form SHALL prefill it from the stored event.

The setting SHALL be meaningful only together with a repeating interval. While the event is non-repeating, the form SHALL NOT present the setting as available, and the system SHALL NOT store the setting for an event it saves without a recurrence — it SHALL save the event without it and SHALL NOT report an error, as it does for a recurrence end date supplied without an interval. The setting SHALL be operable when scripts do not run.

Changing the setting SHALL NOT discard any other stored field of the event, and saving an event through a path that does not present the recurrence controls SHALL leave the stored setting as it is. The public event submission form SHALL NOT offer the setting, and calendar import SHALL NOT set it.

#### Scenario: The setting sits with the recurrence controls
- **WHEN** an authorized user opens the event create form or the event edit form and chooses a repeating interval
- **THEN** the form SHALL present the setting within the same control group as the interval and the recurrence end date

#### Scenario: Hidden while the event does not repeat
- **WHEN** the event's interval is non-repeating
- **THEN** the form SHALL NOT present the setting as available

#### Scenario: Saving a summarised recurring event
- **WHEN** an authorized user chooses a repeating interval with its end date, turns the setting on, and saves
- **THEN** the system SHALL store the setting with the event, and every upcoming-events listing SHALL show the event once at its next occurrence

#### Scenario: The setting without a recurrence is discarded
- **WHEN** a submitted event form carries the setting but no repeating interval
- **THEN** the system SHALL save the event as non-repeating without the setting, and SHALL NOT report an error

#### Scenario: Turning the setting off
- **WHEN** an authorized user turns the setting off on an event that carried it and saves
- **THEN** the system SHALL store the event without the setting, and listings SHALL again show one entry per occurrence

#### Scenario: Switching the setting keeps the event's other fields
- **WHEN** an authorized user turns the setting on or off and saves
- **THEN** the event's title, dates, recurrence, venue, organisers, text, and image SHALL be exactly as they were

#### Scenario: The edit form shows the stored choice
- **WHEN** an authorized user opens the edit form of a recurring event that is summarised by its next occurrence, or of one that is not
- **THEN** the form SHALL show the setting in the matching state

#### Scenario: A save that does not present the recurrence controls
- **WHEN** an event carrying the setting is saved through approval, import adoption, or a permalink change
- **THEN** the system SHALL leave the stored setting unchanged

#### Scenario: Not offered to the public
- **WHEN** a visitor fills in the public event submission form
- **THEN** the form SHALL NOT offer the setting, and the system SHALL NOT accept it from a public submission
