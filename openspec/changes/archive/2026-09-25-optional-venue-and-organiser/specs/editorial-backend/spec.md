## MODIFIED Requirements

### Requirement: Relationship selectors on the event form
The event create and edit forms SHALL present Venue and Organiser as drop-down selectors populated from existing records. Neither SHALL be required: each selector SHALL offer an explicit "no location" / "no organiser" choice, and the forms SHALL save an event that names neither. The public event submission form SHALL continue to require both.

#### Scenario: Drop-downs reflect existing records
- **WHEN** an editor opens the event form after Venues and Organisers have been created
- **THEN** the system SHALL populate the Venue and Organiser drop-downs with those records

#### Scenario: Saving an event with neither
- **WHEN** an editor saves an event having chosen no location and no organiser
- **THEN** the system SHALL persist the event and SHALL NOT report a missing required field

#### Scenario: Public submissions still name both
- **WHEN** a visitor submits an event through the public form without a Venue or without an Organiser
- **THEN** the system SHALL reject the submission and report which field is missing

### Requirement: Relationship selectors on the project form
The project create and edit forms SHALL present the location as a drop-down selector populated from existing Venue records, and the organisers as a multi-select control populated from existing Organiser records that accepts one or more selections. The location selector SHALL offer an explicit "no location" choice and SHALL NOT be required. The form SHALL require at least one organiser before a project can be saved.

#### Scenario: Location and organiser selectors reflect existing records
- **WHEN** an editor opens the project form after Venues and Organisers have been created
- **THEN** the system SHALL populate the location drop-down and the organisers multi-select with those records

#### Scenario: Saving a project without a location
- **WHEN** an editor saves a project having chosen no location, with at least one organiser
- **THEN** the system SHALL persist the project without a location

#### Scenario: At least one organiser is required
- **WHEN** an editor attempts to save a project without selecting any organiser
- **THEN** the system SHALL reject the submission and SHALL NOT persist a project with no organisers

## ADDED Requirements

### Requirement: The review queue distinguishes absent from unresolved references
Where the approval queue presents a submission's Venue or Organiser, it SHALL distinguish a reference the item does not have from one that names a record which no longer exists, so that a reviewer can tell a deliberate omission from broken data.

#### Scenario: An item with no reference
- **WHEN** the queue presents an item that names no Venue or no Organiser
- **THEN** it SHALL say that there is none, rather than reporting an unknown record

#### Scenario: An item whose reference no longer resolves
- **WHEN** the queue presents an item naming a Venue or Organiser that no longer exists
- **THEN** it SHALL report that reference as unknown
