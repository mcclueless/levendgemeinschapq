## ADDED Requirements

### Requirement: Image guidance beside image fields
Every form field that accepts a cover image or a logo SHALL offer, beside its label, a control that reveals guidance on the image to upload. This SHALL apply to the cover field of the create and edit forms for every content type, to the organiser logo field, and to the image upload of the public event submission form. The control SHALL be operable by keyboard, SHALL have an accessible name, and SHALL work when scripts do not run. The guidance SHALL be hidden until the control is used, so the form stays compact.

The cover guidance SHALL recommend an image of 1920 × 1080 pixels (16:9), SHALL state that the site shows covers in several shapes and may cut off the edges, SHALL advise keeping text, faces and logos within the central 1440 × 960 pixels, SHALL show that safe area visually, and SHALL state the accepted file types and the maximum file size. The logo guidance SHALL recommend an image of 1920 × 1080 pixels (16:9), SHALL state that a logo is shown whole and never cut off, and SHALL advise a white or transparent background. The guidance SHALL state the same accepted file types and maximum size that the upload validation enforces.

#### Scenario: Opening the cover guidance
- **WHEN** an authorized user activates the info control beside a cover field on any content form
- **THEN** the form SHALL show the recommended size and ratio, the safe area and its picture, and the accepted file types and size

#### Scenario: Opening the logo guidance
- **WHEN** an authorized user activates the info control beside the organiser logo field
- **THEN** the form SHALL show the logo guidance, not the cover guidance

#### Scenario: Guidance on the public submission form
- **WHEN** a visitor activates the info control beside the image upload on the public event submission form
- **THEN** the form SHALL show the cover guidance, and SHALL NOT reveal anything about the media library

#### Scenario: By keyboard and without scripts
- **WHEN** a user reaches the info control by keyboard, or uses a form with scripts disabled
- **THEN** the control SHALL open and close the guidance

#### Scenario: Guidance matches what uploads accept
- **WHEN** the guidance states the accepted file types and maximum size
- **THEN** they SHALL be those the upload validation enforces
