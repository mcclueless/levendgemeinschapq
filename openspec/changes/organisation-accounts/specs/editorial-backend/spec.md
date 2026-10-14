# Spec Delta

## ADDED Requirements

### Requirement: Scoped backend for an organisation account
When an organisation account is signed in, the backend SHALL show only an overview of its own events, its organisation's event list, its organisation's page, the gallery, and a page to change its password. Every other backend page and action SHALL be refused and the account sent to its overview with a notice. Lists SHALL contain only the organisation's events, owned ones with their actions and co-organised ones read-only, and an address of any other item SHALL respond as not found.

#### Scenario: Navigation per role
- **WHEN** an organisation account views the backend
- **THEN** the navigation SHALL offer Overzicht, Evenementen, Mijn organisatie, Galerij and Wachtwoord, and nothing else

#### Scenario: An admin-only page is refused
- **WHEN** an organisation account opens the address of the queue, the trash, the feeds, the import, the venues, blog posts, projects or accounts pages
- **THEN** the system SHALL send it to its overview with a notice that the page is for the Administrator

#### Scenario: Another organisation's event
- **WHEN** an organisation account opens the edit address of an event owned by another organisation, or posts a change to it
- **THEN** the system SHALL respond as not found and change nothing

### Requirement: Event form for an organisation account
On the event create and edit forms, an organisation account's organisation SHALL be fixed as the primary organiser and SHALL NOT be removable; further organisers MAY be chosen. The agenda-marker mode SHALL NOT be offered to an organisation account, and a request for it SHALL be refused. The account MAY save the event as published or hidden.

#### Scenario: Creating an event
- **WHEN** an organisation account creates an event
- **THEN** the event's primary organiser SHALL be the account's organisation whatever the form posted, and the event SHALL be saved with the chosen venue, further organisers and publication state

#### Scenario: No markers for organisations
- **WHEN** an organisation account's form arrives with the marker mode
- **THEN** the system SHALL refuse the save and say why

### Requirement: Gallery for an organisation account
An organisation account MAY upload images and pick any image from the gallery for its content. Deleting, replacing and bulk actions on images SHALL remain Administrator-only, and the gallery SHALL NOT show those controls to an organisation account.

#### Scenario: Upload and pick
- **WHEN** an organisation account uploads an image in the gallery or picks one in a content form
- **THEN** the system SHALL accept it under the same validation rules as for the Administrator

#### Scenario: Delete refused
- **WHEN** a delete, replace or bulk request on an image arrives from an organisation account
- **THEN** the system SHALL refuse it

### Requirement: Changing one's own password
An organisation account SHALL be able to change its own password from the backend by giving its current password and a new one of at least twelve characters.

#### Scenario: Password changed
- **WHEN** an organisation account gives its correct current password and a valid new one
- **THEN** the new password SHALL apply from then on and the current session SHALL stay valid

#### Scenario: Wrong current password
- **WHEN** the current password given is wrong, or the new one is too short
- **THEN** the system SHALL refuse the change and say why

### Requirement: Traceable backend writes
Every document saved from the backend SHALL record who saved it: the account's email address, or that it was the Administrator. The edit form SHALL show the last recorded saver.

#### Scenario: An organisation account saves
- **WHEN** an organisation account saves an event or its organisation page
- **THEN** the document SHALL record the account's email as its last saver, and the edit form SHALL show it

#### Scenario: The administrator saves after
- **WHEN** the Administrator then saves the same document
- **THEN** the document SHALL record the Administrator as its last saver

## MODIFIED Requirements

### Requirement: Change the permalink of a Location, Organiser, or Project
The backend SHALL allow an Administrator to change the permalink (slug) of an existing Venue, Organisation, or Project, as an action separate from saving the item's content. The requested permalink SHALL be normalised by the same rules used to generate slugs. The system SHALL refuse the change, report why, and leave all content untouched when the normalised permalink is empty, is identical to the current one, or is already used by another item of the same type in any publication status. The system SHALL NOT resolve a collision by appending a suffix. On success the item SHALL be served only at its new public URL; its previous URL SHALL no longer resolve and no redirect SHALL be kept. Every reference to a renamed Venue or Organisation SHALL be updated to the new permalink, whatever the referrer's publication status, including the organisation named on each organisation account. Events and Blog posts SHALL NOT offer a permalink change, and the action SHALL be denied to anyone other than an authenticated Administrator.

#### Scenario: Renaming a project's permalink
- **WHEN** an Administrator changes the permalink of the project at `/projecten/asdfasdf` to `thee-resia-samentuin`
- **THEN** the project SHALL be served at `/projecten/thee-resia-samentuin`, `/projecten/asdfasdf` SHALL return not found, and the project's content, status, and ordering date SHALL be unchanged

#### Scenario: Renaming a venue updates everything that points at it
- **WHEN** an Administrator changes a Venue's permalink and that Venue is referenced by an Event, a Project, a Blog post, an Organiser's location, and a calendar feed's default venue — including referrers that are hidden or in draft
- **THEN** every one of those references SHALL name the new permalink, and each referring public page SHALL link to the Venue's new URL

#### Scenario: Renaming an organiser updates everything that points at it
- **WHEN** an Administrator changes an Organisation's permalink and it is referenced by an Event, a Project's organisers, a Blog post, a calendar feed's default organiser, and an organisation account
- **THEN** every one of those references SHALL name the new permalink, no other field of any referrer SHALL change, and the account SHALL keep its access to the renamed organisation

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
