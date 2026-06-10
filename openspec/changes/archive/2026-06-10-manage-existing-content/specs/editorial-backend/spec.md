## MODIFIED Requirements

### Requirement: Create and edit all content types
The backend SHALL allow authorized users to create and edit Events, Venues, Organisations, and Blog posts through forms appropriate to each type. When editing an existing item, the system SHALL keep the item's slug stable and SHALL preserve frontmatter fields not present on the edit form (for example calendar UID, venue gallery images, blog relationships, and submission metadata).

#### Scenario: Creating each content type
- **WHEN** an authorized user opens the create form for an Event, Venue, Organisation, or Blog post
- **THEN** the system SHALL present the fields for that type and SHALL persist a valid submission as MD/MDX content

#### Scenario: Editing an existing item
- **WHEN** an Administrator opens the edit form for an existing Event, Venue, Organisation, or Blog post
- **THEN** the system SHALL prefill the form from the stored document, and on save SHALL update the same document in place, keeping its slug and any fields the form does not expose

## ADDED Requirements

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
