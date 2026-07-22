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

### Requirement: Uploads are validated by type and size
The system SHALL validate every uploaded file before storing it, regardless of which form it came from. It SHALL accept only files whose extension is on a permitted image allowlist, whose declared content type is an image type consistent with that extension, and whose leading bytes identify it as that image format. It SHALL reject files larger than 10 MB, on both the public and the editorial-backend paths. Rejected uploads SHALL be reported to the user and SHALL NOT be stored.

#### Scenario: Disallowed file type is rejected
- **WHEN** a user attaches a file whose extension or content type is not a permitted image type
- **THEN** the system SHALL reject the upload, report the reason, and SHALL NOT store the file

#### Scenario: Mislabelled file is rejected
- **WHEN** a user attaches a file whose contents do not match its declared image format
- **THEN** the system SHALL reject the upload and SHALL NOT store the file

#### Scenario: Oversized file is rejected
- **WHEN** a user attaches a file larger than 10 MB
- **THEN** the system SHALL reject the upload, report the size limit, and SHALL NOT store the file

#### Scenario: An ordinary photograph is accepted
- **WHEN** a user attaches an unmodified photograph from a typical mobile phone camera that is within the size limit
- **THEN** the system SHALL accept and store it without requiring the user to resize it first

### Requirement: Scriptable image formats are not accepted for upload
The system SHALL NOT accept scriptable image formats for upload, because stored media is served from a location that can execute in the site's own origin. The library MAY continue to list and offer any such images already present.

#### Scenario: Scriptable image upload refused
- **WHEN** any user attempts to upload an image in a scriptable format
- **THEN** the system SHALL reject the upload and SHALL NOT store the file

#### Scenario: Existing scriptable images remain usable
- **WHEN** the media library lists images and a previously stored scriptable image is present
- **THEN** the system SHALL continue to list it and allow an Administrator to select it as a cover

### Requirement: Stored media filenames are not guessable
The system SHALL store an uploaded file under a name that cannot be derived from the file's original name and size alone, so that one upload cannot overwrite another's stored object.

#### Scenario: Two uploads that would collide are both preserved
- **WHEN** two different files are uploaded whose original names and sizes would produce the same stored name
- **THEN** the system SHALL store both and SHALL NOT overwrite the first with the second

### Requirement: The image bank is not browsable outside the backend
The media library listing SHALL remain available only to authenticated backend users. A form outside the authenticated backend MAY accept an upload, but the system SHALL NOT expose any listing, count, or enumeration of stored media to it.

#### Scenario: Public form does not receive the media pool
- **WHEN** an unauthenticated visitor loads a page that offers an image upload
- **THEN** the system SHALL NOT include any listing or enumeration of existing library images in that page or its data payload
