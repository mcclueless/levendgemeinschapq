## ADDED Requirements

### Requirement: Manage saved calendar feeds
The backend SHALL provide an authenticated page listing every saved calendar feed, from which an authorized user can add a feed, edit its URL, label and defaults, delete it, and synchronise it. Unauthenticated users SHALL NOT access it. The listing SHALL show, for each feed, when it was last synchronised and the outcome of that synchronisation.

#### Scenario: Listing saved feeds
- **WHEN** an Administrator opens the calendar feeds page
- **THEN** the system SHALL list every saved feed with its label, its default Venue and Organiser, and the time and outcome of its last synchronisation

#### Scenario: Adding a feed
- **WHEN** an Administrator supplies a calendar URL together with a default Venue and Organiser
- **THEN** the system SHALL save the feed and SHALL show it in the list

#### Scenario: Editing a feed
- **WHEN** an Administrator changes a saved feed's URL, label, or defaults
- **THEN** the system SHALL store the change and SHALL apply the new defaults to entries imported by subsequent synchronisations

#### Scenario: Deleting a feed
- **WHEN** an Administrator deletes a saved feed
- **THEN** the system SHALL remove the feed and SHALL NOT delete, hide, or otherwise alter the events it previously produced

#### Scenario: Feeds are not publicly reachable
- **WHEN** a visitor who is not an authenticated editor browses the site
- **THEN** the system SHALL NOT expose the feeds page, any feed's URL, or any listing of saved feeds

### Requirement: Synchronise action in the backend
The feeds page SHALL offer an explicit action to synchronise a single feed and an action to synchronise every saved feed, and SHALL report the result of the action to the user who triggered it.

#### Scenario: Synchronising one feed from the backend
- **WHEN** an Administrator triggers synchronisation for a single feed
- **THEN** the system SHALL synchronise that feed only and SHALL report how many events were created, skipped, hidden, and flagged

#### Scenario: Reporting a failed synchronisation
- **WHEN** an Administrator triggers a synchronisation that fails
- **THEN** the system SHALL report the reason to the Administrator and SHALL leave existing events unchanged

#### Scenario: One failing feed does not stop the others
- **WHEN** an Administrator synchronises all feeds and one of them cannot be fetched
- **THEN** the system SHALL still synchronise the remaining feeds and SHALL report which feed failed

### Requirement: Pausing a calendar feed
A saved feed SHALL be pausable. A paused feed SHALL retain its URL, label and defaults, SHALL be excluded from the synchronise-all action, and SHALL remain individually synchronisable on request. Pausing SHALL be reversible.

#### Scenario: Paused feed is skipped by synchronise-all
- **WHEN** an Administrator synchronises all feeds and one of them is paused
- **THEN** the system SHALL NOT synchronise the paused feed and SHALL leave its recorded outcome unchanged

#### Scenario: Paused feed can still be synchronised deliberately
- **WHEN** an Administrator triggers synchronisation for a single paused feed
- **THEN** the system SHALL synchronise it

#### Scenario: Pausing preserves the feed
- **WHEN** an Administrator pauses a feed
- **THEN** the system SHALL retain its URL, label and defaults, and SHALL allow the feed to be resumed

#### Scenario: Paused state is visible
- **WHEN** an Administrator opens the calendar feeds page and a feed is paused
- **THEN** the system SHALL indicate that the feed is paused

### Requirement: Failed feed synchronisation is reported on the dashboard
The backend dashboard SHALL warn about every non-paused feed whose most recent synchronisation failed, naming the feed and showing the recorded reason, and SHALL link to the feeds page. Because synchronisation is manual and nothing notifies anyone, a feed that has stopped working is otherwise invisible.

#### Scenario: Dashboard names a broken feed
- **WHEN** an Administrator opens the backend dashboard and a feed's last synchronisation failed
- **THEN** the system SHALL display a warning naming that feed, showing the recorded reason, and linking to the feeds page

#### Scenario: Dashboard is quiet when feeds are healthy
- **WHEN** an Administrator opens the dashboard and no feed's last synchronisation failed
- **THEN** the system SHALL show no feed warning

#### Scenario: Paused feeds are not reported as broken
- **WHEN** a paused feed's last recorded synchronisation was a failure
- **THEN** the dashboard SHALL NOT warn about it
