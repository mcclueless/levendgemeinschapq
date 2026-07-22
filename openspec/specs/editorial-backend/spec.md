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
The backend SHALL allow authorized users to create and edit Events, Venues, Organisations, Blog posts, and Projects through forms appropriate to each type. When editing an existing item, the system SHALL keep the item's slug stable and SHALL preserve frontmatter fields not present on the edit form (for example calendar UID, venue gallery images, blog relationships, a project's automatically-assigned ordering date, and submission metadata).

#### Scenario: Creating each content type
- **WHEN** an authorized user opens the create form for an Event, Venue, Organisation, Blog post, or Project
- **THEN** the system SHALL present the fields for that type and SHALL persist a valid submission as MD/MDX content

#### Scenario: Editing an existing item
- **WHEN** an Administrator opens the edit form for an existing Event, Venue, Organisation, Blog post, or Project
- **THEN** the system SHALL prefill the form from the stored document, and on save SHALL update the same document in place, keeping its slug and any fields the form does not expose

### Requirement: Relationship selectors on the event form
The event creation form SHALL present Venue and Organiser as drop-down selectors populated from existing records.

#### Scenario: Drop-downs reflect existing records
- **WHEN** an editor opens the event form after Venues and Organisers have been created
- **THEN** the system SHALL populate the Venue and Organiser drop-downs with those records

### Requirement: Recurrence controls on the event forms
The event create and edit forms SHALL present a recurrence interval selector (at minimum: non-repeating, weekly, monthly) together with a recurrence end date. The recurrence end date SHALL be required whenever a repeating interval is selected and SHALL be ignored when the event is non-repeating. It SHALL be presented as part of the recurrence control group and SHALL be labelled so that it is distinguishable from the event's own end date and time. The edit form SHALL prefill both controls from the stored event.

#### Scenario: Recurrence end date offered next to the interval
- **WHEN** an editor opens the event create form or the event edit form
- **THEN** the system SHALL present a recurrence interval selector and a recurrence end date within the same control group

#### Scenario: Edit form prefills the stored recurrence
- **WHEN** an Administrator opens the edit form for an event that repeats and has a recurrence end date
- **THEN** the system SHALL prefill the recurrence interval selector and the recurrence end date from the stored event

#### Scenario: Missing recurrence end date is reported on the form
- **WHEN** an editor submits an event form with a repeating interval and no recurrence end date
- **THEN** the system SHALL return the editor to the form and SHALL display a message stating that a recurrence end date is required

#### Scenario: Invalid recurrence end date is reported on the form
- **WHEN** an editor submits an event form with a recurrence end date earlier than the event's start
- **THEN** the system SHALL return the editor to the form and SHALL display a message identifying the recurrence end date as the problem

#### Scenario: Editing an event that repeats without an end date
- **WHEN** an Administrator opens and saves an existing event whose stored recurrence has no end date
- **THEN** the system SHALL require a recurrence end date before the save succeeds

### Requirement: Public event submission supports weekly recurrence
The public event submission form SHALL allow a visitor to mark the submitted event as non-repeating or as repeating weekly, and SHALL require a recurrence end date when weekly is selected. The form SHALL NOT offer the monthly interval available in the editorial backend, and the system SHALL NOT accept a monthly interval from a public submission. A recurring public submission SHALL be written unpublished and SHALL enter the approval queue exactly as a non-recurring submission does.

#### Scenario: Visitor submits a weekly recurring event
- **WHEN** a visitor completes the public event submission form, marks the event as repeating weekly, and supplies a recurrence end date
- **THEN** the system SHALL persist the submission with that recurrence and end date, unpublished, and SHALL place it in the approval queue

#### Scenario: Monthly is not offered publicly
- **WHEN** a visitor opens the public event submission form
- **THEN** the system SHALL offer only non-repeating and weekly as recurrence choices

#### Scenario: Monthly interval rejected from a public submission
- **WHEN** a public submission arrives carrying a monthly recurrence interval
- **THEN** the system SHALL NOT persist a monthly recurrence for that submission

#### Scenario: Recurring submission is not published without approval
- **WHEN** a recurring event is submitted through the public form
- **THEN** the system SHALL NOT present any of its occurrences publicly until an Administrator approves it

#### Scenario: Administrator may widen a submission on approval
- **WHEN** an Administrator opens a pending weekly submission in the editorial backend
- **THEN** the system SHALL allow the recurrence interval to be changed to any interval the backend offers before publishing

#### Scenario: Missing or invalid recurrence end date on the public form
- **WHEN** a visitor submits the public form marking the event as weekly with no recurrence end date, or with one earlier than the event's start
- **THEN** the system SHALL return the visitor to the form with the problem reported and SHALL NOT create a submission

### Requirement: Approval queue shows a submission's recurrence
The approval queue SHALL show, for each pending event, whether it repeats, on what interval, and its recurrence end date when one is set, so that an Administrator can judge the full series being proposed rather than a single occurrence.

#### Scenario: Reviewing a recurring submission
- **WHEN** an Administrator opens the approval queue and a pending event repeats weekly until a given date
- **THEN** the system SHALL display that interval and that end date on the queue entry

#### Scenario: Reviewing an imported open-ended recurring submission
- **WHEN** an Administrator opens the approval queue and a pending imported event repeats with no recurrence end date
- **THEN** the system SHALL display the interval and SHALL indicate that the recurrence is open-ended

### Requirement: Relationship selectors on the project form
The project create and edit forms SHALL present the single location as a drop-down selector populated from existing Venue records, and the organisers as a multi-select control populated from existing Organiser records that accepts one or more selections. The form SHALL require at least one organiser before a project can be saved.

#### Scenario: Location and organiser selectors reflect existing records
- **WHEN** an editor opens the project form after Venues and Organisers have been created
- **THEN** the system SHALL populate the location drop-down and the organisers multi-select with those records

#### Scenario: At least one organiser is required
- **WHEN** an editor attempts to save a project without selecting any organiser
- **THEN** the system SHALL reject the submission and SHALL NOT persist a project with no organisers

### Requirement: Projects are admin-only with no public submission
Projects SHALL be created and managed only through the authenticated editorial backend. The system SHALL NOT expose a public submission form for projects and SHALL NOT place projects into the approval/review queue.

#### Scenario: No public project submission
- **WHEN** a visitor who is not an authenticated editor looks for a way to submit a project
- **THEN** the system SHALL NOT provide a public project submission form

#### Scenario: Projects bypass the review queue
- **WHEN** a project is created through the backend
- **THEN** the system SHALL save it directly without creating a pending review-queue entry

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
The backend SHALL allow an Administrator to permanently delete any content item — Event, Venue, Organisation, or Blog post — removing its document from storage. This is irreversible and SHALL require explicit confirmation. The delete action SHALL always be offered for every type; whether it succeeds is decided at action time by the referential-integrity guard on delete.

#### Scenario: Deleting a content item
- **WHEN** an Administrator confirms permanent deletion of an Event, Venue, Organisation, or Blog post that the delete guard permits
- **THEN** the system SHALL remove that document from storage and it SHALL no longer appear anywhere on the public site or in the backend

#### Scenario: Delete is confirmed before acting
- **WHEN** an Administrator triggers permanent deletion of any content item
- **THEN** the system SHALL require an explicit confirmation before removing it

#### Scenario: Delete action is always offered
- **WHEN** an Administrator views the management actions for any content item
- **THEN** the system SHALL show a permanent-delete action regardless of whether the item is currently deletable

### Requirement: Referential-integrity guard on delete
The backend SHALL prevent permanently deleting a Venue or Organisation referenced by any Event or Blog post — regardless of that referrer's publication status (published, past, or hidden/draft) — and SHALL report the referencing items so the Administrator can reassign or unlink them first. This guard is stricter than the hide guard, which considers only published referrers: because deletion is irreversible, a hidden or draft referrer also blocks it. Events and Blog posts have no inbound references and SHALL always be deletable.

#### Scenario: Deleting a referenced venue or organiser is blocked
- **WHEN** an Administrator attempts to permanently delete a Venue or Organisation referenced by at least one Event or Blog post of any status
- **THEN** the system SHALL refuse the deletion and list the referencing items (including hidden/draft ones)

#### Scenario: Deleting an unreferenced item succeeds
- **WHEN** an Administrator permanently deletes an Event or Blog post, or a Venue or Organisation that no content references in any status
- **THEN** the system SHALL remove the document from storage

#### Scenario: Hidden referrer blocks delete but not hide
- **WHEN** only a hidden/draft Event references a Venue
- **THEN** hiding that Venue SHALL be allowed (the hide guard counts published referrers only) while permanently deleting it SHALL be blocked and SHALL name the hidden referrer

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

### Requirement: Organiser location selector
The Organiser create and edit forms SHALL present an optional selector for the Organiser's Location, populated from existing Venue records (the same kind of drop-down used for the event form's Venue field), with an explicit "no location" choice. The selected venue SHALL be stored as a slug reference on the Organiser.

#### Scenario: Choosing a location for an organiser
- **WHEN** an editor opens the Organiser form after Venues exist
- **THEN** the system SHALL present a Location drop-down listing those Venues plus a "no location" option, and SHALL persist the chosen Venue as a reference on the Organiser

#### Scenario: Organiser without a location
- **WHEN** an editor leaves the Location selector on "no location"
- **THEN** the system SHALL save the Organiser without a linked Location

### Requirement: Social media link inputs
The Event and Organiser create and edit forms SHALL present optional inputs for a curated set of social media profile URLs (Instagram, Facebook, X/Twitter, LinkedIn, YouTube). Provided URLs SHALL be persisted on the item; omitted ones SHALL be left unset.

#### Scenario: Entering social links
- **WHEN** an editor fills in one or more social media URL fields on the Event or Organiser form
- **THEN** the system SHALL persist exactly those URLs on the item and leave unfilled platforms unset

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
