## ADDED Requirements

### Requirement: Choosing where an event leads
The backend Event create and edit forms SHALL offer one choice between three modes, with exactly one selected: the event has its own page on the site, which is the default; the event leads to an external page; or the event has no page and appears only in the agenda. Choosing an external page SHALL ask for its address, SHALL require an image, and SHALL require the address to be an http or https web address, rejecting anything else with a message. Choosing another mode SHALL NOT keep an external address on the event. Changing the mode SHALL NOT discard other stored fields of the event. The choice SHALL work when scripts do not run.

#### Scenario: Saving an external event
- **WHEN** an authorized user chooses an external page, enters a title, a date and time, an image, and an https address, and saves
- **THEN** the system SHALL store the event with that address, and it SHALL be listed linking to it

#### Scenario: An address that is not a web address
- **WHEN** the external address is missing, or is not an http or https address
- **THEN** the system SHALL NOT save the event and SHALL report the problem with the address

#### Scenario: An external event without an image
- **WHEN** an authorized user saves an external event without an image
- **THEN** the system SHALL NOT save it and SHALL ask for an image

#### Scenario: Switching back to an own page
- **WHEN** an authorized user switches an external event to having its own page and saves
- **THEN** the event SHALL have its page again, with its text, venue, and organisers intact, and SHALL no longer carry the external address

#### Scenario: Existing events open in their own mode
- **WHEN** an authorized user opens the edit form of an event that has a page, or of an agenda marker
- **THEN** the form SHALL show the matching mode selected
