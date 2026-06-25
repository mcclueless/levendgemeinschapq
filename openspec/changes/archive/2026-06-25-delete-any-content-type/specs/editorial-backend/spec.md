## MODIFIED Requirements

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

## ADDED Requirements

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
