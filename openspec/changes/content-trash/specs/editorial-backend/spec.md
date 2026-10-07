## MODIFIED Requirements

### Requirement: Permanently delete events
The backend SHALL allow an Administrator to remove any content item — Event, Venue, Organisation, Blog post, or Project — by moving it to the trash. A trashed item SHALL NOT appear on the public site or in the backend's per-type lists and counts. Moving to the trash SHALL require explicit confirmation, SHALL always be offered for every type, and SHALL succeed only when the referential-integrity guard on delete permits it. Permanent removal from storage SHALL happen only from the trash.

#### Scenario: Deleting a content item
- **WHEN** an Administrator confirms removal of an Event, Venue, Organisation, Blog post, or Project that the delete guard permits
- **THEN** the system SHALL move that document to the trash and it SHALL no longer appear anywhere on the public site, in the backend's per-type lists, or in the dashboard counts

#### Scenario: Delete is confirmed before acting
- **WHEN** an Administrator triggers removal of any content item
- **THEN** the system SHALL require an explicit confirmation before moving it to the trash, and the confirmation SHALL say that the item can be restored from the trash

#### Scenario: Delete action is always offered
- **WHEN** an Administrator views the management actions for any content item
- **THEN** the system SHALL show a remove-to-trash action regardless of whether the item is currently removable

### Requirement: Referential-integrity guard on delete
The backend SHALL prevent moving to the trash a Venue or Organisation referenced by any Event, Blog post, or Project, by an Organisation that has the Venue as its location, or by a calendar feed that uses it as its default — regardless of the referrer's publication status (published, past, or hidden/draft) — and SHALL report the referencing items so the Administrator can reassign or unlink them first. This guard is stricter than the hide guard, which considers only published content: because a trashed item is invisible to every reference check and may later be purged, a hidden or draft referrer, or a feed default, also blocks it. Events, Blog posts, and Projects have no inbound references and SHALL always be removable. Permanent deletion from the trash SHALL NOT run a guard, since the guard at trash time guarantees nothing in the trash is referenced.

#### Scenario: Deleting a referenced venue or organiser is blocked
- **WHEN** an Administrator attempts to move to the trash a Venue or Organisation referenced by at least one Event or Blog post of any status
- **THEN** the system SHALL refuse and list the referencing items (including hidden/draft ones)

#### Scenario: Deleting a venue or organiser used by a project is blocked
- **WHEN** an Administrator attempts to move to the trash a Venue or Organisation referenced by a Project of any status
- **THEN** the system SHALL refuse and list that Project

#### Scenario: Deleting a feed's default venue or organiser is blocked
- **WHEN** an Administrator attempts to move to the trash a Venue or Organisation that a saved calendar feed uses as its default
- **THEN** the system SHALL refuse and name that feed

#### Scenario: Deleting an unreferenced item succeeds
- **WHEN** an Administrator removes an Event, Blog post, or Project, or a Venue or Organisation that no content or feed references in any status
- **THEN** the system SHALL move the document to the trash

#### Scenario: Hidden referrer blocks delete but not hide
- **WHEN** only a hidden/draft Event references a Venue
- **THEN** hiding that Venue SHALL be allowed (the hide guard counts published referrers only) while moving it to the trash SHALL be blocked and SHALL name the hidden referrer

#### Scenario: A trashed referrer no longer blocks
- **WHEN** the only Event referencing a Venue has itself been moved to the trash
- **THEN** moving that Venue to the trash SHALL be allowed

## ADDED Requirements

### Requirement: Trash listing
The backend SHALL provide Administrators a trash page listing every trashed item across all content types, showing each item's title, its content type, and the date it was trashed, newest first. The page SHALL offer a restore action and a permanent-delete action for each item, and an empty-trash action for the whole list. The dashboard SHALL show how many items are in the trash and SHALL link to the trash page.

#### Scenario: Viewing the trash
- **WHEN** an Administrator opens the trash page
- **THEN** the system SHALL list every trashed item with its title, type, and trashed date, newest first, each with restore and permanent-delete actions

#### Scenario: An empty trash
- **WHEN** an Administrator opens the trash page and nothing is trashed
- **THEN** the page SHALL say the trash is empty and SHALL NOT offer the empty-trash action

#### Scenario: Dashboard count
- **WHEN** an Administrator views the dashboard
- **THEN** it SHALL show the number of trashed items and link to the trash page

#### Scenario: Trash access is restricted
- **WHEN** an unauthenticated or non-Administrator request reaches the trash page or any trash action
- **THEN** the system SHALL deny it and redirect to sign in

### Requirement: Restore from the trash
The backend SHALL allow an Administrator to restore a trashed item. A restored item SHALL return to its content type under its original slug as a hidden item, whatever its status was when it was trashed, so that it is not public until deliberately published. The system SHALL refuse the restore, name the conflicting item, and leave both untouched when another item of the same type now uses that slug.

#### Scenario: Restoring an item
- **WHEN** an Administrator restores a trashed item whose slug is free
- **THEN** the system SHALL move the document back to its content type under its original slug with hidden status, and it SHALL appear in that type's backend list as hidden

#### Scenario: Restored items are not public
- **WHEN** an item that was published at the time it was trashed is restored
- **THEN** it SHALL be hidden after the restore and SHALL NOT appear on the public site until an Administrator publishes it

#### Scenario: Restore blocked by a slug collision
- **WHEN** an Administrator restores a trashed item and a different item of the same type now has the same slug
- **THEN** the system SHALL refuse the restore, keep the trashed item in the trash, leave the live item unchanged, and name the live item

### Requirement: Permanently delete from the trash
The backend SHALL allow an Administrator to permanently delete a single trashed item or to empty the trash, removing the documents from storage. Both are irreversible and SHALL require explicit confirmation.

#### Scenario: Permanently deleting one item
- **WHEN** an Administrator confirms permanent deletion of a trashed item
- **THEN** the system SHALL remove that document from storage and it SHALL no longer appear in the trash

#### Scenario: Emptying the trash
- **WHEN** an Administrator confirms emptying the trash
- **THEN** the system SHALL remove every trashed document from storage and the trash SHALL be empty

#### Scenario: Permanent deletion is confirmed before acting
- **WHEN** an Administrator triggers permanent deletion of one item or of the whole trash
- **THEN** the system SHALL require an explicit confirmation that states the action cannot be undone

### Requirement: Trashed items expire
A trashed item SHALL be kept for 30 days from the moment it was trashed. The system SHALL permanently delete items older than that when the trash page is next opened; no scheduled job is involved. Until then the item SHALL remain restorable.

#### Scenario: Expired items are purged on viewing the trash
- **WHEN** an Administrator opens the trash page and it contains items trashed more than 30 days ago
- **THEN** the system SHALL remove those documents from storage before showing the list, and they SHALL NOT appear in it

#### Scenario: Items within the retention period are kept
- **WHEN** the trash page is opened and an item was trashed 30 days ago or less
- **THEN** the item SHALL remain listed and restorable

#### Scenario: Expiry shown per item
- **WHEN** an Administrator views a trashed item on the trash page
- **THEN** the page SHALL show when the item will expire
