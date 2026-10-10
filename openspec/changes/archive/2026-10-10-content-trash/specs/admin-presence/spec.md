## MODIFIED Requirements

### Requirement: Public-side hide and delete actions
When an administrator hides or deletes an item from its own public page, the system SHALL apply the same content rules as the backend and SHALL return the administrator to the relevant public listing (since the item's own page is no longer publicly available), with a confirmation of the outcome. Hiding a venue or organiser that is still referenced by a published event or blog post SHALL be blocked using the hide reference guard; the item SHALL remain published and the administrator SHALL be shown which published items still reference it. Deleting from the banner SHALL be available for every content type and SHALL move the item to the trash, applying the all-status delete guard: a venue or organiser referenced by any event or blog post (of any status) SHALL be blocked and the referencing items named. The confirmation and the banner's wording SHALL say the item goes to the trash and can be restored from the backend.

#### Scenario: Hiding an item from its page
- **WHEN** an administrator confirms "Verbergen" on a content item's page
- **THEN** the system SHALL set the item to draft, revalidate the public site, and redirect to that content type's public listing with a confirmation

#### Scenario: Deleting an item from its page
- **WHEN** an administrator confirms "Verwijderen" on an event, venue, organiser, blog, or project page that the delete guard permits
- **THEN** the system SHALL move that item to the trash, revalidate the public site, and redirect to that content type's public listing with a confirmation that says the item is in the trash

#### Scenario: Delete blocked by references
- **WHEN** an administrator attempts to delete a venue or organiser from its page while any event or blog post (of any status) still references it
- **THEN** the system SHALL NOT move it to the trash and SHALL show which items reference it, mirroring the backend's delete guard

#### Scenario: Hide blocked by references
- **WHEN** an administrator attempts to hide a venue or organiser that a published event or blog post still references
- **THEN** the system SHALL NOT hide it and SHALL show a message naming the referencing published items, mirroring the backend's hide guard
