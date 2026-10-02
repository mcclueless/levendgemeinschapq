## MODIFIED Requirements

### Requirement: Reference-safe image deletion
The media library SHALL allow the administrator to delete an image, removing it from the media store. Before deleting, the system SHALL check whether the image is still used by any published or draft content — as the cover image of any content item of any type, in a venue's gallery, among an organiser's images or as its logo, or as an image within the body text of any content item. If the image is in use, the system SHALL NOT delete it and SHALL name the content items that reference it.

#### Scenario: Deleting an unused image
- **WHEN** an administrator deletes an image that no content references
- **THEN** the system SHALL remove it from the media store and from the library grid

#### Scenario: Deletion blocked by references
- **WHEN** an administrator attempts to delete an image still used as a cover image, in a venue gallery, among an organiser's images or as its logo, or within the body text of a content item
- **THEN** the system SHALL NOT delete it and SHALL show which content items reference it

#### Scenario: An image used within a post's text
- **WHEN** an administrator attempts to delete an image that appears only within the body text of a blog post or an event
- **THEN** the system SHALL NOT delete it and SHALL name that post or event

#### Scenario: An image used as a project's cover
- **WHEN** an administrator attempts to delete an image used as a project's cover image
- **THEN** the system SHALL NOT delete it and SHALL name that project

#### Scenario: An image used as an organiser's logo or slide
- **WHEN** an administrator attempts to delete an image used only as an organiser's logo, or as one of its images other than the first
- **THEN** the system SHALL NOT delete it and SHALL name that organiser
