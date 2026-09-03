# accessibility-compliance Specification

## Purpose

Defines responsive layout, WCAG 2.1 AA accessibility conformance, EU cookie notification and consent gating, and the site-wide footer with required content.

## Requirements

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

Withholding a non-essential third party SHALL mean not loading it at all: the
system SHALL NOT request the third party's script, so that no contact is made with
it and no cookie of its is set, rather than loading it in a suppressed mode.

Consent SHALL be recorded per category of non-essential use rather than as a single
switch, and the visitor SHALL be able to allow one category while declining
another. The controls the site offers for reviewing consent SHALL report the
categories the visitor has actually allowed.

The site's published cookie policy SHALL describe each category of non-essential
cookie or tracker the site uses.

#### Scenario: Consent gate for non-essential cookies
- **WHEN** a first-time visitor loads the site
- **THEN** the system SHALL display a cookie notice and SHALL withhold non-essential cookies/trackers until consent is given

#### Scenario: Respecting a decline
- **WHEN** a visitor declines non-essential cookies
- **THEN** the system SHALL operate using only essential cookies and SHALL remember the choice

#### Scenario: A withheld tracker is never requested

- **WHEN** a visitor who has not consented to a non-essential tracker loads any page
- **THEN** the page SHALL contain no reference that would cause that tracker to be
  fetched, and the system SHALL make no request to it

#### Scenario: Allowing one category and declining another

- **WHEN** a visitor allows one category of non-essential use and declines another
- **THEN** the system SHALL honour each independently, enabling only what was
  allowed

#### Scenario: Consent controls report the real choice

- **WHEN** a visitor reviews their cookie preferences after choosing
- **THEN** the controls SHALL name the categories they have allowed, and SHALL NOT
  report a category's state on the basis of a different category

#### Scenario: The policy covers what the site uses

- **WHEN** the site uses a non-essential cookie or tracker
- **THEN** its published cookie policy SHALL describe that category of use

### Requirement: Footer with required content
Every page SHALL include a footer containing a table of contents / site navigation, a link to the privacy statement, and other required static content.

#### Scenario: Footer present site-wide
- **WHEN** any page is rendered
- **THEN** the system SHALL display the footer with navigation, the privacy statement link, and required static content

### Requirement: Admin chrome accessibility
The dark admin-chrome surfaces (the public contextual banner and the backend top bar) SHALL meet WCAG 2.1 AA on their own terms. Text and actionable controls on the ink surface SHALL meet the AA contrast ratio against that dark background, interactive controls SHALL show a visible keyboard focus indicator that is perceivable against the dark surface, and hover/active states SHALL remain distinguishable on the dark background.

#### Scenario: Contrast on the dark chrome
- **WHEN** text or controls are rendered on the dark admin chrome
- **THEN** they SHALL meet the WCAG AA contrast ratio against the ink background

#### Scenario: Visible focus on the dark chrome
- **WHEN** a user navigates the admin chrome controls by keyboard
- **THEN** each focused control SHALL show a focus indicator that is clearly perceivable against the dark surface
