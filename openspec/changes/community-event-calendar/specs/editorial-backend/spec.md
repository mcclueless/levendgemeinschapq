## ADDED Requirements

### Requirement: Authenticated editorial backend
The system SHALL provide an authenticated backend that signed-in editors and administrators use to manage content. Unauthenticated users SHALL NOT access the backend.

#### Scenario: Backend requires authentication
- **WHEN** an unauthenticated visitor attempts to open a backend route
- **THEN** the system SHALL deny access and prompt for sign-in

### Requirement: Create and edit all content types
The backend SHALL allow authorized users to create and edit Events, Venues, Organisations, and Blog posts through forms appropriate to each type.

#### Scenario: Creating each content type
- **WHEN** an authorized user opens the create form for an Event, Venue, Organisation, or Blog post
- **THEN** the system SHALL present the fields for that type and SHALL persist a valid submission as MD/MDX content

### Requirement: Relationship selectors on the event form
The event creation form SHALL present Venue and Organiser as drop-down selectors populated from existing records.

#### Scenario: Drop-downs reflect existing records
- **WHEN** an editor opens the event form after Venues and Organisers have been created
- **THEN** the system SHALL populate the Venue and Organiser drop-downs with those records

### Requirement: Media upload
The backend SHALL allow editors to upload images for featured images, venue galleries, and organiser portfolios, storing them in the media store.

#### Scenario: Uploading a featured image
- **WHEN** an editor uploads an image on a content form
- **THEN** the system SHALL store the image and associate it with the content item

### Requirement: Draft and submit for review
The backend SHALL allow content to be saved as a draft and SHALL allow it to be submitted, where submission by a limited user routes the item into the approval queue rather than publishing directly.

#### Scenario: Submitting routes to approval
- **WHEN** a limited user submits an event or blog post
- **THEN** the system SHALL place the item in the approval queue in an unpublished state
