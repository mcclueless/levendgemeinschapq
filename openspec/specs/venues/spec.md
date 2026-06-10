# venues Specification

## Purpose

Defines the Venue content type and its public page: venue fields and contact info, an optional map derived from address/coordinates, an image gallery, and the venue's upcoming events.

## Requirements

### Requirement: Venue entity and fields
The system SHALL represent a Venue with a name, description, and contact information consisting of phone, email, and website. A Venue SHALL be a durable record selectable when creating events.

#### Scenario: Creating a venue
- **WHEN** an editor provides a venue name and description
- **THEN** the system SHALL persist the venue and make it available in the Event venue drop-down

#### Scenario: Optional contact fields
- **WHEN** a venue is saved with some contact fields left blank
- **THEN** the system SHALL store the provided fields and render only the contact details that are present

### Requirement: Google Map display
A Venue page SHALL display a Google Map showing the venue's location, derived from an address or coordinates stored on the venue.

#### Scenario: Map shown for a located venue
- **WHEN** a Venue page is rendered for a venue with a valid address or coordinates
- **THEN** the system SHALL display an embedded Google Map centered on that location

#### Scenario: Venue without location data
- **WHEN** a Venue has no address or coordinates
- **THEN** the system SHALL omit the map without breaking the page layout

### Requirement: Venue image gallery
A Venue MAY include one or more images, which SHALL be displayed as a gallery on the Venue page.

#### Scenario: Gallery rendering
- **WHEN** a Venue with images is viewed
- **THEN** the system SHALL render the venue's images as a gallery

### Requirement: Upcoming events at the venue
A Venue page SHALL display the venue's upcoming events (today and future) using the reusable event listing, ordered soonest first.

#### Scenario: Venue page lists its upcoming events
- **WHEN** a visitor views a Venue page
- **THEN** the system SHALL list the upcoming events whose Venue is this venue, and SHALL exclude past events

### Requirement: Single venue view
The system SHALL provide a dedicated, linkable page for each Venue showing its description, contact information, map, gallery, and upcoming events.

#### Scenario: Viewing one venue
- **WHEN** a visitor opens a Venue page
- **THEN** the system SHALL display the venue's full details and its upcoming events

### Requirement: Address-based venue location
A Venue's location SHALL be specified by a postal address, and the system SHALL derive map coordinates from that address automatically. The system SHALL NOT require an editor to enter latitude/longitude by hand. If the address cannot be resolved to coordinates, the system SHALL still save the venue and display the map from the address, and SHALL inform the editor that precise coordinates were not determined.

#### Scenario: Coordinates derived on save
- **WHEN** an editor saves a venue whose address can be resolved
- **THEN** the system SHALL store coordinates derived from that address and center the venue's map on them

#### Scenario: Unresolvable address still saves
- **WHEN** an editor saves a venue whose address cannot be resolved to coordinates
- **THEN** the system SHALL save the venue with its address, display the map using the address, and inform the editor that coordinates were not determined

#### Scenario: No manual coordinate entry
- **WHEN** an editor creates or edits a venue
- **THEN** the system SHALL NOT require latitude or longitude to be entered by hand

#### Scenario: Existing coordinates preserved when geocoding is unavailable
- **WHEN** an editor edits a venue and geocoding returns no result
- **THEN** the system SHALL preserve the venue's existing coordinates rather than clearing them
