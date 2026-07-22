## ADDED Requirements

### Requirement: Public event submission accepts a featured image by upload
The public event submission form SHALL allow a visitor to attach one featured image by uploading a file. The form SHALL NOT offer any way to choose an existing image from the media library, and the system SHALL NOT accept a reference to an existing image URL from a public submission. The uploaded image SHALL be stored with the submission and SHALL be shown when the submission is published.

#### Scenario: Visitor uploads a cover image
- **WHEN** a visitor completes the public submission form and attaches an image file of a permitted type and size
- **THEN** the system SHALL store the image, associate it with the submission as its featured image, and place the submission in the approval queue unpublished

#### Scenario: No library picker on the public form
- **WHEN** a visitor opens the public event submission form
- **THEN** the system SHALL offer only a file upload control and SHALL NOT present any listing, picker, or count of existing library images

#### Scenario: Image reference from a public submission is not honoured
- **WHEN** a public submission arrives carrying a reference to an existing or external image URL rather than an uploaded file
- **THEN** the system SHALL ignore that reference and SHALL NOT set it as the submission's featured image

#### Scenario: Submission without an image
- **WHEN** a visitor submits the form without attaching an image
- **THEN** the system SHALL accept the submission and SHALL render it without a featured image

### Requirement: Public event submission accepts social media links
The public event submission form SHALL offer the same set of social media platform fields the editorial backend offers, and SHALL validate the supplied URLs before the submission is stored.

#### Scenario: Visitor supplies social links
- **WHEN** a visitor supplies one or more valid social media URLs
- **THEN** the system SHALL store them with the submission and SHALL render them on the event's page once published

#### Scenario: Platforms left empty are omitted
- **WHEN** a visitor leaves some or all social fields empty
- **THEN** the system SHALL store only the platforms that were filled in

### Requirement: Social media URLs are validated before storage
The system SHALL validate every social media URL at the point of submission, on both the public and the editorial-backend paths, and SHALL NOT store a value that would fail the stored-content validation. A URL supplied without a scheme SHALL be normalised before validation. The system SHALL accept only web URL schemes and SHALL reject any other scheme.

#### Scenario: Scheme-less URL is normalised
- **WHEN** a user supplies a social media URL with no scheme, such as a bare profile address
- **THEN** the system SHALL normalise it to a web URL and SHALL store the normalised form

#### Scenario: Invalid URL is rejected at submission
- **WHEN** a user supplies a social media value that is not a valid URL after normalisation
- **THEN** the system SHALL reject the save, SHALL identify the offending platform field, and SHALL NOT store the value

#### Scenario: Non-web scheme is rejected
- **WHEN** a user supplies a social media value using a scheme other than a web URL scheme
- **THEN** the system SHALL reject the save and SHALL NOT store the value

#### Scenario: A submission is never lost to invalid social input
- **WHEN** a public submission carries a social media value the stored-content validation would reject
- **THEN** the system SHALL prevent the submission from being stored in that state, so that the submission cannot be created and then be invisible to the approval queue

### Requirement: Approval queue shows a submission's image and social links
The approval queue SHALL display a pending event's featured image and its social media links, so that an Administrator reviews the media and links being proposed rather than approving them unseen.

#### Scenario: Reviewing a submission with an image and links
- **WHEN** an Administrator opens the approval queue and a pending event has a featured image and social media links
- **THEN** the system SHALL display that image and those links on the queue entry

#### Scenario: Reviewing a submission without media
- **WHEN** an Administrator opens the approval queue and a pending event has neither an image nor social links
- **THEN** the system SHALL render the entry without media and without layout breakage
