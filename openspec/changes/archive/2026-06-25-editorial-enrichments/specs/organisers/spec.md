## ADDED Requirements

### Requirement: Organiser linked location
An Organiser MAY reference a Location (Venue). When set, the Organiser's public page SHALL show the linked Location in its contact information as a row that links to that Venue's page. When not set, no Location row SHALL appear.

#### Scenario: Organiser with a linked location
- **WHEN** a visitor views an Organiser that has a linked Location
- **THEN** the contact block SHALL include a "Locatie" row whose link opens that Venue's page

#### Scenario: Organiser without a linked location
- **WHEN** a visitor views an Organiser with no linked Location
- **THEN** no Location row SHALL be shown

### Requirement: Organiser social media links
An Organiser MAY have social media profile URLs for a curated set of platforms. The Organiser's public page SHALL render the platforms that are set as a row of icon links; platforms without a URL SHALL be omitted, and an Organiser with none SHALL show no social row.

#### Scenario: Organiser with social links
- **WHEN** a visitor views an Organiser that has one or more social media URLs
- **THEN** the page SHALL show an icon link for each set platform, opening the corresponding profile

#### Scenario: Organiser without social links
- **WHEN** a visitor views an Organiser with no social media URLs
- **THEN** no social media row SHALL be shown
