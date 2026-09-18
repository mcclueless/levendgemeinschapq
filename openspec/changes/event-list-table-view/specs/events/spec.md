## ADDED Requirements

### Requirement: Switchable view and loading more on the homepage and agenda
The event listings on the homepage and on `/agenda` SHALL let a visitor switch between a card view and a table view, and SHALL let a visitor load more events in place. The card view SHALL be the default. The chosen view and the number of events shown SHALL be carried only in the page URL, so that a link or a Back navigation restores them. The system SHALL NOT store them anywhere else, so a new visit starts on the card view with the initial number of events. Both controls SHALL work without JavaScript. The homepage listing SHALL start with 6 events and load 6 more at a time; the agenda SHALL start with 12 and load 12 more at a time. Both SHALL cover today and the next 90 days. Switching view SHALL keep the number of events shown, and loading more SHALL keep the chosen view. Event listings on Venue and Organiser pages SHALL NOT offer these controls.

#### Scenario: Card view is the default
- **WHEN** a visitor opens the homepage or `/agenda` without view parameters
- **THEN** the system SHALL render the event listing as cards, with the initial number of events for that page

#### Scenario: Switching to the table
- **WHEN** a visitor chooses the table view
- **THEN** the system SHALL render the same events, in the same order and number, as a table, and the URL SHALL reflect the table view

#### Scenario: The active view is identifiable
- **WHEN** the view switch is rendered
- **THEN** it SHALL be labelled as a view choice and SHALL mark the active view to assistive technology as well as visually

#### Scenario: Loading more
- **WHEN** a visitor activates "Meer laden" while more events exist within the 90 days
- **THEN** the system SHALL show the next batch of events after those already shown, keep the chosen view, and report how many of the total are now shown

#### Scenario: Nothing more to load
- **WHEN** every event within the 90 days is shown
- **THEN** the system SHALL NOT offer "Meer laden"

#### Scenario: Out-of-range or invalid parameters
- **WHEN** the URL carries an unknown view or a count that is not a positive whole number
- **THEN** the system SHALL fall back to the card view and the initial number of events rather than failing

#### Scenario: A new visit resets the view
- **WHEN** a visitor who chose the table view later opens the homepage or `/agenda` from a link without view parameters
- **THEN** the system SHALL render the card view

#### Scenario: Controls without JavaScript
- **WHEN** a visitor without JavaScript uses the view switch or "Meer laden"
- **THEN** the system SHALL render the requested view and number of events as an ordinary page load

## MODIFIED Requirements

### Requirement: Listing display variants
The system SHALL provide event listings in at least three variants: one that includes each event's featured image, one that is text-only (without images), and a table. The table SHALL show, for each occurrence, its date, its time (with the end time when the event has one), the event title linking to the event, the location linking to the Venue, the organiser linking to the Organiser, and how often the event repeats when it does. The table SHALL identify its columns to assistive technology. On narrow screens each table row SHALL be presented as a stacked block that keeps every field, rather than dropping columns or requiring horizontal scrolling.

#### Scenario: Image and text-only variants
- **WHEN** a listing is requested in the image variant or the text-only variant
- **THEN** the system SHALL render the corresponding layout for the same underlying set of upcoming events

#### Scenario: Table variant
- **WHEN** a listing is requested in the table variant
- **THEN** the system SHALL render one row per occurrence with date, time, event, location, organiser, and repetition, with the event, location, and organiser linking to their pages

#### Scenario: Table on a narrow screen
- **WHEN** the table variant is shown on a phone-width screen
- **THEN** each row SHALL stack its fields vertically, every field SHALL remain visible, and the page SHALL NOT scroll horizontally
