# media-library Specification

## Purpose

Defines the standalone backend media library: browsing the image bank, uploading new images, and reference-safe deletion (an image still used as a cover or in a venue gallery cannot be deleted, and the using items are named), plus the points from which the library is reachable.

## Requirements

### Requirement: Browse the image bank
The system SHALL provide an authenticated backend page that lists every image in the media bank, newest first, with a visual thumbnail for each. Unauthenticated users SHALL NOT access it.

#### Scenario: Administrator browses uploaded images
- **WHEN** a signed-in administrator opens the media library
- **THEN** the system SHALL display all uploaded images as a thumbnail grid, newest first

#### Scenario: Empty library
- **WHEN** no images have been uploaded yet
- **THEN** the system SHALL show an empty-state message instead of an empty grid

### Requirement: Upload images from the library
The media library SHALL allow the administrator to upload one or more new images directly, storing them in the media store and showing them in the grid.

#### Scenario: Uploading a new image
- **WHEN** an administrator uploads an image file from the media library
- **THEN** the system SHALL store it in the media store and the image SHALL appear in the library grid

### Requirement: Reference-safe image deletion
The media library SHALL allow the administrator to delete an image, removing it from the media store. Before deleting, the system SHALL check whether the image is still used by any published or draft content — as a content item's cover image or in a venue's gallery. If the image is in use, the system SHALL NOT delete it and SHALL name the content items that reference it.

#### Scenario: Deleting an unused image
- **WHEN** an administrator deletes an image that no content references
- **THEN** the system SHALL remove it from the media store and from the library grid

#### Scenario: Deletion blocked by references
- **WHEN** an administrator attempts to delete an image still used as a cover image or in a venue gallery
- **THEN** the system SHALL NOT delete it and SHALL show which content items reference it

### Requirement: Library access points
The media library SHALL be reachable from the backend navigation and from the admin-presence banner shown on public content-item pages.

#### Scenario: Reaching the library
- **WHEN** a signed-in administrator uses the backend navigation or the admin-presence banner
- **THEN** the system SHALL offer a link that opens the media library
