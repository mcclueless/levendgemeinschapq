## MODIFIED Requirements

### Requirement: Upcoming events for the organiser
An Organiser page SHALL display the organiser's upcoming events (today and future) using the reusable event listing, ordered soonest first.

#### Scenario: Organiser page lists its upcoming events
- **WHEN** a visitor views an Organiser page
- **THEN** the system SHALL list the upcoming events that name this organiser among their Organisers, and SHALL exclude past events

#### Scenario: An event with several organisers
- **WHEN** an upcoming event names this organiser and other Organisers
- **THEN** the event SHALL appear on this organiser's page and on the page of each of its other Organisers
