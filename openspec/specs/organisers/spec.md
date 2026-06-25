# organisers Specification

## Purpose

Defines the Organiser content type and its public page: organiser fields and contact info, an optional cover image, and the organiser's upcoming events.

## Requirements

### Requirement: Organiser entity and fields
The system SHALL represent an Organiser with a name, description, and contact information consisting of phone, email, and website. An Organiser SHALL be a durable record selectable when creating events.

#### Scenario: Creating an organiser
- **WHEN** an editor provides an organiser name and description
- **THEN** the system SHALL persist the organiser and make it available in the Event organiser drop-down

#### Scenario: Optional contact fields
- **WHEN** an organiser is saved with some contact fields left blank
- **THEN** the system SHALL store the provided fields and render only the contact details that are present

### Requirement: Upcoming events for the organiser
An Organiser page SHALL display the organiser's upcoming events (today and future) using the reusable event listing, ordered soonest first.

#### Scenario: Organiser page lists its upcoming events
- **WHEN** a visitor views an Organiser page
- **THEN** the system SHALL list the upcoming events whose Organiser is this organiser, and SHALL exclude past events

### Requirement: Single organiser view
The system SHALL provide a dedicated, linkable page for each Organiser showing its description, contact information, and upcoming events, giving each organiser a page that represents them.

#### Scenario: Viewing one organiser
- **WHEN** a visitor opens an Organiser page
- **THEN** the system SHALL display the organiser's full details and upcoming events

### Requirement: Organiser linked location
An Organiser MAY reference a Location (Venue). When set, the Organiser's public page SHALL show the linked Location in its contact information as a row that links to that Venue's page. When not set, no Location row SHALL appear.

#### Scenario: Organiser with a linked location
- **WHEN** a visitor views an Organiser that has a linked Location
- **THEN** the contact block SHALL include a "Locatie" row whose link opens that Venue's page

#### Scenario: Organiser without a linked location
- **WHEN** a visitor views an Organiser with no linked Location
- **THEN** no Location row SHALL be shown

### Requirement: Organiser social media links
An Organiser MAY have social media profile URLs for a curated set of platforms. The Organiser's public page SHALL render the platforms that are set as a row of icon links; platforms without a URL SHALL be omitted, and an Organiser with none SHALL show no social row.

#### Scenario: Organiser with social links
- **WHEN** a visitor views an Organiser that has one or more social media URLs
- **THEN** the page SHALL show an icon link for each set platform, opening the corresponding profile

#### Scenario: Organiser without social links
- **WHEN** a visitor views an Organiser with no social media URLs
- **THEN** no social media row SHALL be shown
