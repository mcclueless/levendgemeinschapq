## ADDED Requirements

### Requirement: Change the permalink of a Location, Organiser, or Project
The backend SHALL allow an Administrator to change the permalink (slug) of an existing Venue, Organisation, or Project, as an action separate from saving the item's content. The requested permalink SHALL be normalised by the same rules used to generate slugs. The system SHALL refuse the change, report why, and leave all content untouched when the normalised permalink is empty, is identical to the current one, or is already used by another item of the same type in any publication status. The system SHALL NOT resolve a collision by appending a suffix. On success the item SHALL be served only at its new public URL; its previous URL SHALL no longer resolve and no redirect SHALL be kept. Every reference to a renamed Venue or Organisation SHALL be updated to the new permalink, whatever the referrer's publication status. Events and Blog posts SHALL NOT offer a permalink change, and the action SHALL be denied to anyone other than an authenticated Administrator.

#### Scenario: Renaming a project's permalink
- **WHEN** an Administrator changes the permalink of the project at `/projecten/asdfasdf` to `thee-resia-samentuin`
- **THEN** the project SHALL be served at `/projecten/thee-resia-samentuin`, `/projecten/asdfasdf` SHALL return not found, and the project's content, status, and ordering date SHALL be unchanged

#### Scenario: Renaming a venue updates everything that points at it
- **WHEN** an Administrator changes a Venue's permalink and that Venue is referenced by an Event, a Project, a Blog post, an Organiser's location, and a calendar feed's default venue — including referrers that are hidden or in draft
- **THEN** every one of those references SHALL name the new permalink, and each referring public page SHALL link to the Venue's new URL

#### Scenario: Renaming an organiser updates everything that points at it
- **WHEN** an Administrator changes an Organisation's permalink and it is referenced by an Event, a Project's organisers, a Blog post, and a calendar feed's default organiser
- **THEN** every one of those references SHALL name the new permalink, and no other field of any referrer SHALL change

#### Scenario: Requested permalink is normalised
- **WHEN** an Administrator enters `Thee-resia Samentuin!` as the new permalink
- **THEN** the system SHALL use `thee-resia-samentuin`

#### Scenario: Permalink already taken
- **WHEN** an Administrator requests a permalink already used by another item of the same type, including a hidden or draft one
- **THEN** the system SHALL refuse the change, say the permalink is taken, and SHALL NOT change any content or assign a suffixed alternative

#### Scenario: Empty or unchanged permalink
- **WHEN** the requested permalink normalises to an empty value or to the item's current permalink
- **THEN** the system SHALL refuse the change and leave all content untouched

#### Scenario: Interrupted rename leaves no broken link
- **WHEN** a permalink change fails after it has started
- **THEN** every reference SHALL still resolve to an existing item, and repeating the same change SHALL complete it

#### Scenario: No permalink change for events and blog posts
- **WHEN** an Administrator opens the edit form of an Event or Blog post
- **THEN** the system SHALL NOT offer a permalink change, and a request to change one SHALL be refused

#### Scenario: Unauthenticated permalink change is denied
- **WHEN** a permalink change arrives without an authenticated Administrator session
- **THEN** the system SHALL deny it and redirect to the backend sign-in

## MODIFIED Requirements

### Requirement: Create and edit all content types
The backend SHALL allow authorized users to create and edit Events, Venues, Organisations, Blog posts, and Projects through forms appropriate to each type. When editing an existing item, the system SHALL keep the item's slug stable and SHALL preserve frontmatter fields not present on the edit form (for example calendar UID, venue gallery images, blog relationships, a project's automatically-assigned ordering date, and submission metadata). The only way an item's slug changes is the explicit permalink change for a Venue, Organisation, or Project.

#### Scenario: Creating each content type
- **WHEN** an authorized user opens the create form for an Event, Venue, Organisation, Blog post, or Project
- **THEN** the system SHALL present the fields for that type and SHALL persist a valid submission as MD/MDX content

#### Scenario: Editing an existing item
- **WHEN** an Administrator opens the edit form for an existing Event, Venue, Organisation, Blog post, or Project
- **THEN** the system SHALL prefill the form from the stored document, and on save SHALL update the same document in place, keeping its slug and any fields the form does not expose

#### Scenario: Changing the title does not change the slug
- **WHEN** an Administrator saves an edit that changes an item's title or name
- **THEN** the item's slug and public URL SHALL remain unchanged

### Requirement: Referential-integrity guard on hide
The backend SHALL prevent hiding a Venue or Organisation referenced by any published Event, Blog post, or Project, or — for a Venue — by any published Organisation that has it as its location, and SHALL report the referencing items so the Administrator can resolve them first. Items that no published content references SHALL always be hideable.

#### Scenario: Hiding a referenced venue or organiser is blocked
- **WHEN** an Administrator attempts to hide a Venue or Organisation referenced by at least one published Event or Blog post
- **THEN** the system SHALL refuse the action and list the referencing published items

#### Scenario: Hiding a venue or organiser used by a project is blocked
- **WHEN** an Administrator attempts to hide a Venue that is a published Project's location, or an Organisation that is one of a published Project's organisers
- **THEN** the system SHALL refuse the action and list that Project

#### Scenario: Hiding a venue that is an organiser's location is blocked
- **WHEN** an Administrator attempts to hide a Venue that a published Organisation has as its location
- **THEN** the system SHALL refuse the action and list that Organisation

#### Scenario: Hiding an unreferenced item succeeds
- **WHEN** an Administrator hides an Event or Blog post, or a Venue or Organisation that no published item references
- **THEN** the system SHALL hide it

### Requirement: Referential-integrity guard on delete
The backend SHALL prevent permanently deleting a Venue or Organisation referenced by any Event, Blog post, or Project, by an Organisation that has the Venue as its location, or by a calendar feed that uses it as its default — regardless of the referrer's publication status (published, past, or hidden/draft) — and SHALL report the referencing items so the Administrator can reassign or unlink them first. This guard is stricter than the hide guard, which considers only published content: because deletion is irreversible, a hidden or draft referrer, or a feed default, also blocks it. Events and Blog posts have no inbound references and SHALL always be deletable.

#### Scenario: Deleting a referenced venue or organiser is blocked
- **WHEN** an Administrator attempts to permanently delete a Venue or Organisation referenced by at least one Event or Blog post of any status
- **THEN** the system SHALL refuse the deletion and list the referencing items (including hidden/draft ones)

#### Scenario: Deleting a venue or organiser used by a project is blocked
- **WHEN** an Administrator attempts to permanently delete a Venue or Organisation referenced by a Project of any status
- **THEN** the system SHALL refuse the deletion and list that Project

#### Scenario: Deleting a feed's default venue or organiser is blocked
- **WHEN** an Administrator attempts to permanently delete a Venue or Organisation that a saved calendar feed uses as its default
- **THEN** the system SHALL refuse the deletion and name that feed

#### Scenario: Deleting an unreferenced item succeeds
- **WHEN** an Administrator permanently deletes an Event or Blog post, or a Venue or Organisation that no content or feed references in any status
- **THEN** the system SHALL remove the document from storage

#### Scenario: Hidden referrer blocks delete but not hide
- **WHEN** only a hidden/draft Event references a Venue
- **THEN** hiding that Venue SHALL be allowed (the hide guard counts published referrers only) while permanently deleting it SHALL be blocked and SHALL name the hidden referrer
