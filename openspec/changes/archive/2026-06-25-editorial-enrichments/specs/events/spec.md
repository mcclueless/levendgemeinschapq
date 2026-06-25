## ADDED Requirements

### Requirement: Event social media links
An Event MAY have social media profile URLs for a curated set of platforms. The Event's public page SHALL render the platforms that are set as a row of icon links; platforms without a URL SHALL be omitted, and an Event with none SHALL show no social row.

#### Scenario: Event with social links
- **WHEN** a visitor views an Event that has one or more social media URLs
- **THEN** the page SHALL show an icon link for each set platform, opening the corresponding profile

#### Scenario: Event without social links
- **WHEN** a visitor views an Event with no social media URLs
- **THEN** no social media row SHALL be shown
