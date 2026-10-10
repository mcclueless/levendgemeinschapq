## ADDED Requirements

### Requirement: Agenda markers without a page
An Event MAY be marked as having no page, making it an agenda marker: an image on a day in the agenda, such as a holiday or the start of a season. A marker SHALL appear in upcoming-event listings by its date like any event, but SHALL NOT link anywhere, SHALL NOT show a time, and SHALL NOT have a page of its own. Its address SHALL respond as not found, and it SHALL be left out of the sitemap and of structured data. Events not marked SHALL be unaffected.

#### Scenario: A marker in the card view
- **WHEN** a listing in the image variant includes a marker
- **THEN** it SHALL show the marker's whole image without cropping, followed by its date without a time and its title, and SHALL NOT link to a page

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

### Requirement: Creating an agenda marker
The backend Event create and edit forms SHALL offer a choice to give the event no page. With it chosen, the form SHALL ask for the start as a date without a time, SHALL require an image, and SHALL hide the fields a marker never presents: description text, short description, end, Venue, Organisers, and social links. Hiding a field SHALL NOT discard its stored value, so that clearing the choice restores the event as it was. The system SHALL store a marker's dates at the start of their day.

#### Scenario: Saving a marker
- **WHEN** an authorized user chooses no page, enters a title, a date, and an image, and saves
- **THEN** the system SHALL store the event as a marker on that date

#### Scenario: A marker without an image
- **WHEN** an authorized user saves a marker without an image
- **THEN** the system SHALL NOT save it and SHALL ask for an image

#### Scenario: A time entered for a marker
- **WHEN** a marker is saved with a start or further date that carries a time
- **THEN** the system SHALL store that date at the start of its day

#### Scenario: Turning a marker back into an event
- **WHEN** an authorized user clears the no-page choice on an event that had a venue, organisers, or text before it became a marker, and saves
- **THEN** the event SHALL have its page again, with those values intact

#### Scenario: Without scripts
- **WHEN** the event form is used without scripts
- **THEN** the no-page choice SHALL still work, with the start entered as a date and time whose time is ignored
