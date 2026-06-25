## ADDED Requirements

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
