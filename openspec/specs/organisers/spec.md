# organisers Specification

## Purpose

Defines the Organiser content type and its public page: organiser fields and contact info, a portfolio showcase (image grid linking to descriptions/external pages or events), and the organiser's upcoming events.

## Requirements

### Requirement: Organiser entity and fields
The system SHALL represent an Organiser with a name, description, and contact information consisting of phone, email, and website. An Organiser SHALL be a durable record selectable when creating events.

#### Scenario: Creating an organiser
- **WHEN** an editor provides an organiser name and description
- **THEN** the system SHALL persist the organiser and make it available in the Event organiser drop-down

#### Scenario: Optional contact fields
- **WHEN** an organiser is saved with some contact fields left blank
- **THEN** the system SHALL store the provided fields and render only the contact details that are present

### Requirement: Organiser portfolio showcase
An Organiser page SHALL support a portfolio presented as an image grid. Each portfolio item SHALL, when activated, either open a view with the item's description and an external link, or link to an associated upcoming or recurring event.

#### Scenario: Portfolio item with description and external link
- **WHEN** a visitor activates a portfolio item configured with a description and external URL
- **THEN** the system SHALL present the item's image, description, and a link to the external page

#### Scenario: Portfolio item linking to an event
- **WHEN** a visitor activates a portfolio item configured to reference an event
- **THEN** the system SHALL navigate to that event's page

### Requirement: Upcoming events for the organiser
An Organiser page SHALL display the organiser's upcoming events (today and future) using the reusable event listing, ordered soonest first.

#### Scenario: Organiser page lists its upcoming events
- **WHEN** a visitor views an Organiser page
- **THEN** the system SHALL list the upcoming events whose Organiser is this organiser, and SHALL exclude past events

### Requirement: Single organiser view
The system SHALL provide a dedicated, linkable page for each Organiser showing its description, contact information, portfolio, and upcoming events, giving each organiser a page that represents them.

#### Scenario: Viewing one organiser
- **WHEN** a visitor opens an Organiser page
- **THEN** the system SHALL display the organiser's full details, portfolio, and upcoming events
