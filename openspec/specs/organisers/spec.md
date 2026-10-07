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

### Requirement: Organiser logo
An Organiser MAY have a logo, an image separate from its other images. When set, the Organiser's page SHALL show the logo beside the organiser's name, with the organiser's name as its alternative text. When not set, the page SHALL show no logo and no empty placeholder.

#### Scenario: Organiser with a logo
- **WHEN** a visitor views an Organiser that has a logo
- **THEN** the page SHALL show the logo next to the organiser's name

#### Scenario: Organiser without a logo
- **WHEN** a visitor views an Organiser without a logo
- **THEN** the page SHALL show no logo area, and its contact details SHALL start at the top of the side column

### Requirement: Organiser image slideshow
An Organiser MAY have several images, in an order chosen by the editor. The first SHALL serve as the Organiser's cover wherever a single image represents it. The Organiser's page SHALL present its images as a slideshow that a visitor moves through by hand, with controls for the previous and next image and one per image, and by swiping. The slideshow SHALL NOT advance on its own. It SHALL remain scrollable when scripts do not run, and its controls SHALL be operable by keyboard with accessible names. With a single image the page SHALL show that image without controls, and with none it SHALL show no image area.

#### Scenario: Several images
- **WHEN** a visitor views an Organiser with three images
- **THEN** the page SHALL show the first image with controls to move to the others, and SHALL indicate which of the three is shown

#### Scenario: One image
- **WHEN** a visitor views an Organiser with exactly one image
- **THEN** the page SHALL show that image without slideshow controls

#### Scenario: The slideshow does not move on its own
- **WHEN** a visitor leaves an Organiser page with several images open without interacting
- **THEN** the shown image SHALL NOT change

#### Scenario: The first image is the cover
- **WHEN** an Organiser with several images is shown in a list or a share preview
- **THEN** its first image SHALL be used

### Requirement: Organiser page layout
On a wide screen, an Organiser's page SHALL present two columns from the top: the main column with the organiser's name, then its images, then its description; and a side column with its logo, then its contact information. The organiser's upcoming events SHALL follow below both columns at full width. On a narrow screen the page SHALL present one column in the order name, logo, images, description, contact information, upcoming events.

#### Scenario: Wide screen
- **WHEN** a visitor views an Organiser page on a wide screen
- **THEN** the logo and contact information SHALL appear in a column beside the name, images and description, and the upcoming events SHALL appear below at full width

#### Scenario: Narrow screen
- **WHEN** a visitor views an Organiser page on a phone-width screen
- **THEN** the content SHALL appear in one column in the order name, logo, images, description, contact information, upcoming events, without horizontal scrolling

#### Scenario: A long email or web address
- **WHEN** an Organiser's email or web address is wider than its contact information
- **THEN** the address SHALL wrap onto further lines inside the contact information, without running past its edge or being cut off
