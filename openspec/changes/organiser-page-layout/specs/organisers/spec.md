## ADDED Requirements

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
