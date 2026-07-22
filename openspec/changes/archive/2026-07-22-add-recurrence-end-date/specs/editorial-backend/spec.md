## ADDED Requirements

### Requirement: Recurrence controls on the event forms
The event create and edit forms SHALL present a recurrence interval selector (at minimum: non-repeating, weekly, monthly) together with a recurrence end date. The recurrence end date SHALL be required whenever a repeating interval is selected and SHALL be ignored when the event is non-repeating. It SHALL be presented as part of the recurrence control group and SHALL be labelled so that it is distinguishable from the event's own end date and time. The edit form SHALL prefill both controls from the stored event.

#### Scenario: Recurrence end date offered next to the interval
- **WHEN** an editor opens the event create form or the event edit form
- **THEN** the system SHALL present a recurrence interval selector and a recurrence end date within the same control group

#### Scenario: Edit form prefills the stored recurrence
- **WHEN** an Administrator opens the edit form for an event that repeats and has a recurrence end date
- **THEN** the system SHALL prefill the recurrence interval selector and the recurrence end date from the stored event

#### Scenario: Missing recurrence end date is reported on the form
- **WHEN** an editor submits an event form with a repeating interval and no recurrence end date
- **THEN** the system SHALL return the editor to the form and SHALL display a message stating that a recurrence end date is required

#### Scenario: Invalid recurrence end date is reported on the form
- **WHEN** an editor submits an event form with a recurrence end date earlier than the event's start
- **THEN** the system SHALL return the editor to the form and SHALL display a message identifying the recurrence end date as the problem

#### Scenario: Editing an event that repeats without an end date
- **WHEN** an Administrator opens and saves an existing event whose stored recurrence has no end date
- **THEN** the system SHALL require a recurrence end date before the save succeeds

### Requirement: Public event submission supports weekly recurrence
The public event submission form SHALL allow a visitor to mark the submitted event as non-repeating or as repeating weekly, and SHALL require a recurrence end date when weekly is selected. The form SHALL NOT offer the monthly interval available in the editorial backend, and the system SHALL NOT accept a monthly interval from a public submission. A recurring public submission SHALL be written unpublished and SHALL enter the approval queue exactly as a non-recurring submission does.

#### Scenario: Visitor submits a weekly recurring event
- **WHEN** a visitor completes the public event submission form, marks the event as repeating weekly, and supplies a recurrence end date
- **THEN** the system SHALL persist the submission with that recurrence and end date, unpublished, and SHALL place it in the approval queue

#### Scenario: Monthly is not offered publicly
- **WHEN** a visitor opens the public event submission form
- **THEN** the system SHALL offer only non-repeating and weekly as recurrence choices

#### Scenario: Monthly interval rejected from a public submission
- **WHEN** a public submission arrives carrying a monthly recurrence interval
- **THEN** the system SHALL NOT persist a monthly recurrence for that submission

#### Scenario: Recurring submission is not published without approval
- **WHEN** a recurring event is submitted through the public form
- **THEN** the system SHALL NOT present any of its occurrences publicly until an Administrator approves it

#### Scenario: Administrator may widen a submission on approval
- **WHEN** an Administrator opens a pending weekly submission in the editorial backend
- **THEN** the system SHALL allow the recurrence interval to be changed to any interval the backend offers before publishing

#### Scenario: Missing or invalid recurrence end date on the public form
- **WHEN** a visitor submits the public form marking the event as weekly with no recurrence end date, or with one earlier than the event's start
- **THEN** the system SHALL return the visitor to the form with the problem reported and SHALL NOT create a submission

### Requirement: Approval queue shows a submission's recurrence
The approval queue SHALL show, for each pending event, whether it repeats, on what interval, and its recurrence end date when one is set, so that an Administrator can judge the full series being proposed rather than a single occurrence.

#### Scenario: Reviewing a recurring submission
- **WHEN** an Administrator opens the approval queue and a pending event repeats weekly until a given date
- **THEN** the system SHALL display that interval and that end date on the queue entry

#### Scenario: Reviewing an imported open-ended recurring submission
- **WHEN** an Administrator opens the approval queue and a pending imported event repeats with no recurrence end date
- **THEN** the system SHALL display the interval and SHALL indicate that the recurrence is open-ended
