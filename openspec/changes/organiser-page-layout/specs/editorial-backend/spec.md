## ADDED Requirements

### Requirement: Managing an organiser's images and logo
The backend Organiser create and edit forms SHALL let an authorized user keep an ordered list of images, adding an image by uploading it or by choosing it from the media library, removing one, and moving one earlier or later. The first image in the list SHALL be stored as the Organiser's cover. The forms SHALL offer a separate logo, set by uploading or choosing from the media library, and removable. Uploads SHALL be validated and stored as any other upload. Saving the form SHALL store the list in the order shown.

#### Scenario: Adding images
- **WHEN** an authorized user adds two images to an Organiser, one uploaded and one chosen from the library, and saves
- **THEN** the system SHALL store both, in the order shown, and the first SHALL be the Organiser's cover

#### Scenario: Reordering images
- **WHEN** an authorized user moves the second image to the first place and saves
- **THEN** that image SHALL become the Organiser's cover and the first slide

#### Scenario: Removing every image
- **WHEN** an authorized user removes all of an Organiser's images and saves
- **THEN** the Organiser SHALL have no images, and its page SHALL show no image area

#### Scenario: Setting and removing a logo
- **WHEN** an authorized user sets a logo and saves, and later removes it and saves
- **THEN** the Organiser SHALL first have that logo and then none

#### Scenario: Existing organisers
- **WHEN** an authorized user opens the edit form of an Organiser saved before this change, with one cover image
- **THEN** the image list SHALL contain that cover as its only image
