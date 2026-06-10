## ADDED Requirements

### Requirement: Reuse an existing cover image
The backend SHALL let an authorized user set a content item's cover image either by uploading a new image or by choosing one from a browsable pool of previously uploaded images. The pool SHALL contain all images held in the media store. This applies to Events, Venues, Organisations, and Blog posts, on both their create and edit forms. This applies to cover images only; it does not add images within content bodies.

#### Scenario: Choosing an existing image from the pool
- **WHEN** an editor opens the cover-image field and selects an image from the pool
- **THEN** the system SHALL set that image as the item's cover without uploading a new file

#### Scenario: Uploading a new cover image
- **WHEN** an editor uploads a new image on the cover-image field
- **THEN** the system SHALL store it, set it as the item's cover, and make it available in the pool for future reuse

#### Scenario: Editing without changing the cover
- **WHEN** an editor saves an edit without selecting a pool image or uploading a new one
- **THEN** the system SHALL keep the item's current cover image
