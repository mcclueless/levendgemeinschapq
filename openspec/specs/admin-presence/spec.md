# admin-presence Specification

## Purpose

Defines the administrator's presence on the public site under the single-admin interim auth: a footer sign-in entry and signed-in state, the contextual per-item admin banner (published-items-only, surfacing existing backend actions, no inline editing), the client-readable session hint, the static-cache-safe rendering model, and the public-side hide/delete actions with reference-aware behavior.

## Requirements

### Requirement: Footer sign-in entry and signed-in state
The site footer SHALL present a sign-in affordance on every page. When no administrator session is present, the footer SHALL show a discreet link to the backend login. When an administrator session is present, the footer SHALL instead show that the administrator is signed in, with a link to the backend overview and a sign-out action. The footer's signed-in state SHALL be determined on the client from the session hint so that public pages remain statically cacheable.

#### Scenario: Visitor sees the sign-in link
- **WHEN** a visitor who is not signed in views any page
- **THEN** the footer SHALL show a discreet "Beheer" link that leads to the backend login

#### Scenario: Administrator sees signed-in state
- **WHEN** a signed-in administrator views any page
- **THEN** the footer SHALL show "Ingelogd als beheerder" with a link to the overview ("Overzicht") and a sign-out action ("Uitloggen"), and SHALL NOT show the plain sign-in link

### Requirement: Contextual admin banner on content-item pages
The system SHALL display a contextual admin banner on the public pages of individual content items — events, venues, organisers, and blog posts — and only there. The banner SHALL be visible only to a signed-in administrator. The banner SHALL surface, for the item on the page, the management actions that already exist in the backend: edit ("Bewerken"), hide ("Verbergen"), permanent delete ("Verwijderen", events only), and a link to the backend overview. The banner SHALL NOT provide inline editing of page content; its actions only navigate to the backend or trigger existing content actions.

#### Scenario: Administrator viewing a content item
- **WHEN** a signed-in administrator views an event, venue, organiser, or blog post page
- **THEN** the banner SHALL appear with an Edit action linking to that item's backend edit form, a Hide action for that item, a link to the overview, and — for an event — a Delete action

#### Scenario: Banner not shown to visitors
- **WHEN** a visitor who is not signed in views any content-item page
- **THEN** no admin banner SHALL be rendered or revealed

#### Scenario: Banner absent on non-item pages
- **WHEN** a signed-in administrator views the home page, a listing page, or a static page (no single content item)
- **THEN** no contextual banner SHALL appear, while the footer signed-in state SHALL still be available

#### Scenario: Events-only delete
- **WHEN** a signed-in administrator views a venue, organiser, or blog post page
- **THEN** the banner SHALL NOT offer a permanent delete action

### Requirement: Published-items-only scope
The contextual banner SHALL operate only on published items. Because unpublished items are not reachable on public pages, the banner SHALL NOT present a publish action and SHALL NOT present a publication-status indicator. Publishing drafts SHALL remain a backend-only action.

#### Scenario: No publish affordance on the public banner
- **WHEN** the banner is shown on any content-item page
- **THEN** it SHALL NOT offer a "Publiceren" action nor display a draft/published status indicator

### Requirement: Client-readable session hint
The system SHALL maintain a non-`httpOnly` session hint cookie that the client uses to decide whether to reveal the footer signed-in state and the contextual banner. The hint SHALL be set when an administrator signs in and cleared when the administrator signs out, with the same lifetime as the session cookie. The hint SHALL NOT be treated as proof of authorization; all privileged actions SHALL remain protected by the server-side session.

#### Scenario: Hint set and cleared with the session
- **WHEN** an administrator signs in
- **THEN** the system SHALL set the client-readable hint alongside the server session; and **WHEN** the administrator signs out, the system SHALL clear both

#### Scenario: Stale hint fails safe
- **WHEN** the client hint is present but the server session has expired and the administrator activates a banner action
- **THEN** the server SHALL deny the action and redirect to the backend login, so the stale hint cannot grant access

### Requirement: Static-cache-safe rendering
The contextual banner and the footer signed-in state SHALL NOT cause public pages to be rendered per-user or excluded from caching. Page markup SHALL be identical for all users and safe to cache; only client-readable, non-secret context (such as the item type, slug, title, and edit URL) SHALL be embedded in the page, and the decision to reveal admin UI SHALL be made on the client after hydration.

#### Scenario: Public pages stay cacheable
- **WHEN** a content-item page is generated
- **THEN** its cached markup SHALL contain no session-dependent output and SHALL be served identically to administrators and visitors, with the banner revealed only by client-side hydration

#### Scenario: No secrets in page markup
- **WHEN** the page embeds context for the banner
- **THEN** that context SHALL contain only non-secret, already-public information (item type, slug, title, backend edit URL) and no session token or authorization data

### Requirement: Public-side hide and delete actions
When an administrator hides or deletes an item from its own public page, the system SHALL apply the same content rules as the backend and SHALL return the administrator to the relevant public listing (since the item's own page is no longer publicly available), with a confirmation of the outcome. Hiding a venue or organiser that is still referenced by a published event or blog post SHALL be blocked using the hide reference guard; the item SHALL remain published and the administrator SHALL be shown which published items still reference it. Permanent deletion SHALL be available from the banner for every content type and SHALL apply the all-status delete guard: deleting a venue or organiser referenced by any event or blog post (of any status) SHALL be blocked and the referencing items named.

#### Scenario: Hiding an item from its page
- **WHEN** an administrator confirms "Verbergen" on a content item's page
- **THEN** the system SHALL set the item to draft, revalidate the public site, and redirect to that content type's public listing with a confirmation

#### Scenario: Deleting an item from its page
- **WHEN** an administrator confirms "Verwijderen" on an event, venue, organiser, or blog page that the delete guard permits
- **THEN** the system SHALL permanently delete that item, revalidate the public site, and redirect to that content type's public listing with a confirmation

#### Scenario: Delete blocked by references
- **WHEN** an administrator attempts to delete a venue or organiser from its page while any event or blog post (of any status) still references it
- **THEN** the system SHALL NOT delete it and SHALL show which items reference it, mirroring the backend's delete guard

#### Scenario: Hide blocked by references
- **WHEN** an administrator attempts to hide a venue or organiser that a published event or blog post still references
- **THEN** the system SHALL NOT hide it and SHALL show a message naming the referencing published items, mirroring the backend's hide guard
