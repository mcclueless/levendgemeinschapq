# Spec Delta

## MODIFIED Requirements

### Requirement: Listing display variants
The system SHALL provide event listings in at least three variants: one that includes each event's featured image, one that is text-only (without images), and a table. In the image variant each card SHALL show, under its image, the event title first, then its location when it has one, and its date last. The table SHALL show, for each occurrence, its date, its time (with the end time when the event has one), the event title linking to the event, the location linking to the Venue, each of its organisers linking to that Organiser, and how often the event repeats when it does. The table SHALL identify its columns to assistive technology. On narrow screens each table row SHALL be presented as a stacked block that keeps every field, rather than dropping columns or requiring horizontal scrolling.

#### Scenario: Image and text-only variants
- **WHEN** a listing is requested in the image variant or the text-only variant
- **THEN** the system SHALL render the corresponding layout for the same underlying set of upcoming events

#### Scenario: Card order
- **WHEN** a listing is requested in the image variant
- **THEN** each card SHALL show its image, then the title, then the location when the event has one, and the date box last

#### Scenario: Table variant
- **WHEN** a listing is requested in the table variant
- **THEN** the system SHALL render one row per occurrence with date, time, event, location, organiser, and repetition, with the event, location, and each organiser linking to their pages

#### Scenario: Table on a narrow screen
- **WHEN** the table variant is shown on a phone-width screen
- **THEN** each row SHALL stack its fields vertically, every field SHALL remain visible, and the page SHALL NOT scroll horizontally

### Requirement: Agenda markers without a page
An Event MAY be marked as having no page, making it an agenda marker: an image on a day in the agenda, such as a holiday or the start of a season. A marker SHALL appear in upcoming-event listings by its date like any event, but SHALL NOT link anywhere, SHALL NOT show a time, and SHALL NOT have a page of its own. Its address SHALL respond as not found, and it SHALL be left out of the sitemap and of structured data. Events not marked SHALL be unaffected.

#### Scenario: A marker in the card view
- **WHEN** a listing in the image variant includes a marker
- **THEN** it SHALL show the marker's whole image without cropping, followed by its title and then its date without a time, and SHALL NOT link to a page

#### Scenario: A marker in the text and table views
- **WHEN** a listing in the text-only or table variant includes a marker
- **THEN** it SHALL show the marker's date and title without a time and without a link

#### Scenario: A marker's address
- **WHEN** a visitor requests the address an ordinary event with the marker's slug would have
- **THEN** the system SHALL respond as not found

#### Scenario: A marker is not in the sitemap
- **WHEN** the sitemap is generated
- **THEN** it SHALL NOT include any marker

#### Scenario: A marker on several dates
- **WHEN** a marker repeats or carries further dates
- **THEN** each upcoming date SHALL appear in listings as a marker

#### Scenario: Ordinary events are unaffected
- **WHEN** an event is not marked as having no page
- **THEN** the system SHALL present it, link to it, and publish its page exactly as before
