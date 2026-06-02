## ADDED Requirements

### Requirement: Responsive layout
The site SHALL be responsive and usable on smartphone, tablet, and desktop viewports, with no horizontal scrolling or clipped content at common breakpoints.

#### Scenario: Rendering across devices
- **WHEN** any public page is viewed on a phone, tablet, or desktop width
- **THEN** the system SHALL present a layout adapted to that viewport without broken or clipped content

### Requirement: Accessibility conformance
The site SHALL conform to WCAG 2.1 AA, including sufficient color contrast, keyboard operability, visible focus, semantic structure, and text alternatives for meaningful images.

#### Scenario: Keyboard navigation
- **WHEN** a visitor navigates using only the keyboard
- **THEN** the system SHALL allow reaching and operating all interactive elements with a visible focus indicator

#### Scenario: Image alternatives
- **WHEN** a meaningful image (e.g., event featured image) is rendered
- **THEN** the system SHALL provide a text alternative

### Requirement: EU cookie notification and consent
The site SHALL present an EU cookie notification and SHALL NOT set non-essential cookies or load non-essential trackers until the visitor has consented.

#### Scenario: Consent gate for non-essential cookies
- **WHEN** a first-time visitor loads the site
- **THEN** the system SHALL display a cookie notice and SHALL withhold non-essential cookies/trackers until consent is given

#### Scenario: Respecting a decline
- **WHEN** a visitor declines non-essential cookies
- **THEN** the system SHALL operate using only essential cookies and SHALL remember the choice

### Requirement: Footer with required content
Every page SHALL include a footer containing a table of contents / site navigation, a link to the privacy statement, and other required static content.

#### Scenario: Footer present site-wide
- **WHEN** any page is rendered
- **THEN** the system SHALL display the footer with navigation, the privacy statement link, and required static content
