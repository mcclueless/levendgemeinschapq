## MODIFIED Requirements

### Requirement: Recurrence controls on the event forms
The event create and edit forms SHALL present a recurrence selector offering, at minimum, non-repeating, weekly, every two weeks and monthly, together with a recurrence end date. The recurrence end date SHALL be required whenever a repeating choice is selected and SHALL be ignored when the event is non-repeating. It SHALL be presented as part of the recurrence control group and SHALL be labelled so that it is distinguishable from the event's own end date and time. The edit form SHALL prefill both controls from the stored event. When the stored recurrence is one the selector does not offer, such as every three weeks from a calendar import, the edit form SHALL show it as its own selected choice, worded as the system describes that recurrence elsewhere, and SHALL keep it on save until the editor chooses another. A choice the editor makes SHALL replace the stored frequency and interval entirely. The public submission form is unchanged by this requirement and keeps its narrower set of choices.

#### Scenario: Recurrence end date offered next to the interval
- **WHEN** an editor opens the event create form or the event edit form
- **THEN** the system SHALL present a recurrence selector and a recurrence end date within the same control group

#### Scenario: Every two weeks is a choice
- **WHEN** an editor opens the event create form or the event edit form
- **THEN** the recurrence selector SHALL offer every two weeks beside weekly and monthly, and saving with it and a recurrence end date SHALL store a recurrence that repeats every second week

#### Scenario: Edit form prefills the stored recurrence
- **WHEN** an Administrator opens the edit form for an event that repeats and has a recurrence end date
- **THEN** the system SHALL prefill the recurrence selector and the recurrence end date from the stored event, selecting every two weeks for an event that repeats every second week

#### Scenario: A stored rhythm the selector does not offer is shown and kept
- **WHEN** an editor opens the edit form of an event whose stored recurrence is not among the offered choices, such as every three weeks, and saves without changing the selector
- **THEN** the selector SHALL show that rhythm as its own selected choice, worded as the system describes it elsewhere, and the saved event SHALL repeat exactly as before

#### Scenario: An explicit choice replaces the stored rhythm
- **WHEN** an editor changes the selector of an event that repeats every second week to weekly and saves
- **THEN** the event SHALL repeat every week from then on

#### Scenario: Missing recurrence end date is reported on the form
- **WHEN** an editor submits an event form with a repeating choice and no recurrence end date
- **THEN** the system SHALL return the editor to the form and SHALL display a message stating that a recurrence end date is required

#### Scenario: Invalid recurrence end date is reported on the form
- **WHEN** an editor submits an event form with a recurrence end date earlier than the event's start
- **THEN** the system SHALL return the editor to the form and SHALL display a message identifying the recurrence end date as the problem

#### Scenario: Editing an event that repeats without an end date
- **WHEN** an Administrator opens and saves an existing event whose stored recurrence has no end date
- **THEN** the system SHALL require a recurrence end date before the save succeeds
