# Spec Delta

## MODIFIED Requirements

### Requirement: Upload images from the library
The media library SHALL allow the administrator to upload one or more new images directly, storing them in the media store and showing them in the grid. The administrator SHALL be able to choose several files at once or drop them on the page. Each file SHALL be validated and stored on its own, the result SHALL be reported per file, and a rejected file SHALL NOT prevent the others from being stored. Uploading a single image SHALL work without JavaScript. The upload control SHALL present as a button that matches the backend's other buttons and names the action, driving a hidden native file input; without scripts, the plain file input and its own submit button SHALL remain.

#### Scenario: Uploading a new image
- **WHEN** an administrator uploads an image file from the media library
- **THEN** the system SHALL store it in the media store and the image SHALL appear in the library grid

#### Scenario: Uploading several images at once
- **WHEN** an administrator chooses or drops five image files in the media library
- **THEN** the system SHALL store all five and they SHALL appear in the library grid

#### Scenario: One file of several is rejected
- **WHEN** an administrator uploads several files and one of them is not a permitted image
- **THEN** the system SHALL store the others, SHALL NOT store the rejected file, and SHALL report which file was rejected and why

#### Scenario: The upload control reads as a button
- **WHEN** an administrator views the media library with scripts running
- **THEN** the upload control SHALL be a button styled like the backend's other buttons, labelled with the action, and pressing it SHALL open the file chooser; choosing files SHALL start the upload at once

#### Scenario: The upload control without scripts
- **WHEN** an administrator views the media library without scripts
- **THEN** the page SHALL show a native file input and a submit button, and submitting one file SHALL store it
