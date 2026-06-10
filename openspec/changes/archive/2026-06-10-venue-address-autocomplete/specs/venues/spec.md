## ADDED Requirements

### Requirement: Address autocomplete for venues
When entering a Venue's address, the backend SHALL offer address suggestions as the editor types, and SHALL — when the editor selects a suggestion — capture that location's coordinates directly rather than re-deriving them. An address typed without selecting a suggestion SHALL fall back to automatic geocoding (per the address-based location requirement). Suggestions SHALL be sourced without requiring a paid API key.

#### Scenario: Selecting a suggestion sets the location
- **WHEN** an editor types an address and selects one of the offered suggestions
- **THEN** the system SHALL fill the address from the suggestion and store that suggestion's coordinates as the venue's location

#### Scenario: Typed address without selection
- **WHEN** an editor saves a venue with an address typed but no suggestion selected
- **THEN** the system SHALL attempt to geocode the address and otherwise behave as the address-based location requirement specifies

#### Scenario: Suggestions unavailable
- **WHEN** address suggestions cannot be retrieved
- **THEN** the address field SHALL remain usable as a plain text input and the venue SHALL still be saveable
