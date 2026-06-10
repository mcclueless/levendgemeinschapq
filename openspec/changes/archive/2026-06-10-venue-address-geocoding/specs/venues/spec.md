## ADDED Requirements

### Requirement: Address-based venue location
A Venue's location SHALL be specified by a postal address, and the system SHALL derive map coordinates from that address automatically. The system SHALL NOT require an editor to enter latitude/longitude by hand. If the address cannot be resolved to coordinates, the system SHALL still save the venue and display the map from the address, and SHALL inform the editor that precise coordinates were not determined.

#### Scenario: Coordinates derived on save
- **WHEN** an editor saves a venue whose address can be resolved
- **THEN** the system SHALL store coordinates derived from that address and center the venue's map on them

#### Scenario: Unresolvable address still saves
- **WHEN** an editor saves a venue whose address cannot be resolved to coordinates
- **THEN** the system SHALL save the venue with its address, display the map using the address, and inform the editor that coordinates were not determined

#### Scenario: No manual coordinate entry
- **WHEN** an editor creates or edits a venue
- **THEN** the system SHALL NOT require latitude or longitude to be entered by hand

#### Scenario: Existing coordinates preserved when geocoding is unavailable
- **WHEN** an editor edits a venue and geocoding returns no result
- **THEN** the system SHALL preserve the venue's existing coordinates rather than clearing them
