# editorial-backend Specification

## Purpose

Defines the authenticated editorial backend: route protection, create/edit forms for all content types, relationship selectors on the event form, media upload, and the draft / submit-for-review flow.

## Requirements

### Requirement: Authenticated editorial backend
The system SHALL provide an authenticated backend that signed-in editors and administrators use to manage content. Unauthenticated users SHALL NOT access the backend.

#### Scenario: Backend requires authentication
- **WHEN** an unauthenticated visitor attempts to open a backend route
- **THEN** the system SHALL deny access and prompt for sign-in

### Requirement: Create and edit all content types
The backend SHALL allow authorized users to create and edit Events, Venues, Organisations, and Blog posts through forms appropriate to each type. When editing an existing item, the system SHALL keep the item's slug stable and SHALL preserve frontmatter fields not present on the edit form (for example calendar UID, venue gallery images, blog relationships, and submission metadata).

#### Scenario: Creating each content type
- **WHEN** an authorized user opens the create form for an Event, Venue, Organisation, or Blog post
- **THEN** the system SHALL present the fields for that type and SHALL persist a valid submission as MD/MDX content

#### Scenario: Editing an existing item
- **WHEN** an Administrator opens the edit form for an existing Event, Venue, Organisation, or Blog post
- **THEN** the system SHALL prefill the form from the stored document, and on save SHALL update the same document in place, keeping its slug and any fields the form does not expose

### Requirement: Relationship selectors on the event form
The event creation form SHALL present Venue and Organiser as drop-down selectors populated from existing records.

#### Scenario: Drop-downs reflect existing records
- **WHEN** an editor opens the event form after Venues and Organisers have been created
- **THEN** the system SHALL populate the Venue and Organiser drop-downs with those records

### Requirement: Media upload
The backend SHALL allow editors to upload cover/featured images (events, venues, organisers, blog posts) and venue galleries, storing them in the media store.

#### Scenario: Uploading a featured image
- **WHEN** an editor uploads an image on a content form
- **THEN** the system SHALL store the image and associate it with the content item

### Requirement: Draft and submit for review
The backend SHALL allow content to be saved as a draft and SHALL allow it to be submitted, where submission by a limited user routes the item into the approval queue rather than publishing directly.

#### Scenario: Submitting routes to approval
- **WHEN** a limited user submits an event or blog post
- **THEN** the system SHALL place the item in the approval queue in an unpublished state

### Requirement: List existing content for management
The backend SHALL provide Administrators a per-type listing of existing Events, Venues, Organisations, and Blog posts, showing each item's title and publication status and offering actions to edit and to hide or show it.

#### Scenario: Browsing a content type
- **WHEN** an Administrator opens the management list for a content type
- **THEN** the system SHALL list every item of that type regardless of publication status, each with its title, status, and edit / hide-or-show actions

### Requirement: Hide and show content
The backend SHALL allow an Administrator to hide a published item (removing it from the public site by setting it unpublished) and to show a hidden item again. Hiding SHALL NOT delete the underlying document.

#### Scenario: Hiding removes an item from the public site
- **WHEN** an Administrator hides a published Event, Venue, Organisation, or Blog post
- **THEN** the system SHALL set it unpublished so it no longer appears in public listings and its public detail page is not found, while retaining the stored document

#### Scenario: Showing restores an item
- **WHEN** an Administrator shows a previously hidden item
- **THEN** the system SHALL publish it again so it reappears on the public site

### Requirement: Referential-integrity guard on hide
The backend SHALL prevent hiding a Venue or Organisation referenced by any published Event or Blog post, and SHALL report the referencing items so the Administrator can resolve them first. Items that no published content references SHALL always be hideable.

#### Scenario: Hiding a referenced venue or organiser is blocked
- **WHEN** an Administrator attempts to hide a Venue or Organisation referenced by at least one published Event or Blog post
- **THEN** the system SHALL refuse the action and list the referencing published items

#### Scenario: Hiding an unreferenced item succeeds
- **WHEN** an Administrator hides an Event or Blog post, or a Venue or Organisation that no published item references
- **THEN** the system SHALL hide it

### Requirement: Permanently delete events
The backend SHALL allow an Administrator to permanently delete an Event, removing its document from storage. This is irreversible and SHALL require explicit confirmation. Permanent deletion SHALL NOT be offered for Venues, Organisations, or Blog posts. Nothing references Events, so deletion needs no reference guard.

#### Scenario: Deleting an event
- **WHEN** an Administrator confirms permanent deletion of an Event
- **THEN** the system SHALL remove the Event document from storage and it SHALL no longer appear anywhere on the public site or in the backend

#### Scenario: Delete is confirmed before acting
- **WHEN** an Administrator triggers permanent deletion of an Event
- **THEN** the system SHALL require an explicit confirmation before removing it

### Requirement: Administrator-only management actions
Editing, hiding, and showing existing content SHALL be restricted to Administrators; unauthenticated or unauthorized requests SHALL be denied and redirected to sign in.

#### Scenario: Unauthenticated management attempt is denied
- **WHEN** a request to edit, hide, or show content arrives without an authenticated Administrator session
- **THEN** the system SHALL deny the action and redirect to the backend sign-in

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
