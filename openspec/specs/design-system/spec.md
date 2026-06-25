# design-system Specification

## Purpose

Defines the shared visual language: a warm AA-contrast color palette via tokens, a readable typographic scale, a reusable component library, and friendly, scannable information design.

## Requirements

### Requirement: Warm, accessible color palette
The site SHALL use a warm, friendly color palette applied consistently via design tokens, and every text/background pairing SHALL meet WCAG AA contrast.

#### Scenario: Consistent themed surfaces
- **WHEN** any page or component is rendered
- **THEN** the system SHALL apply the shared warm palette tokens and SHALL maintain AA-contrast text

### Requirement: Typography and readability
The site SHALL define a typographic scale with legible font sizes and line lengths tuned for easy reading by a broad audience.

#### Scenario: Readable body text
- **WHEN** body content is rendered
- **THEN** the system SHALL apply the defined typographic scale with a comfortable reading measure and line height

### Requirement: Reusable component library
The site SHALL provide a shared library of reusable UI components (cards, event listings, buttons, forms, galleries) so presentation is consistent across pages.

#### Scenario: Consistent components
- **WHEN** the same kind of element (e.g., an event card) appears on different pages
- **THEN** the system SHALL render it from the shared component with consistent styling and behavior

### Requirement: Friendly, simple information design
The interface SHALL present events, venues, and organisers in a simple, attractive manner that is easy to scan and consume.

#### Scenario: Scannable listings
- **WHEN** a visitor views an event listing
- **THEN** the system SHALL present each event so its key facts (title, date/time, venue) are scannable at a glance

### Requirement: Admin chrome visual token
The design system SHALL define a distinct dark "ink" admin-chrome treatment — surface color, text color, and focus/hover/active states — used for management UI. This treatment SHALL be applied consistently to both the public contextual admin banner and the backend top bar, establishing a single visual language so that the dark chrome reliably signals "management mode" and is clearly distinct from the warm public palette.

#### Scenario: Shared treatment across surfaces
- **WHEN** the public admin banner and the backend top bar are rendered
- **THEN** both SHALL use the same dark ink admin-chrome treatment, visibly distinct from the public site's warm palette

#### Scenario: Backend reads as the backend
- **WHEN** an administrator is in the backend
- **THEN** the backend chrome SHALL be unmistakably distinct from the public site so it is always clear which context they are in

### Requirement: Styled file-upload control
The design system SHALL provide a styled file-upload control whose visible affordance matches the other buttons in the same field (in particular the "Kies uit galerij" button), rather than exposing the raw native file input. The control SHALL drive a visually-hidden native file input and SHALL show the chosen file's name as feedback. It SHALL remain keyboard-operable and accessible.

#### Scenario: Cover-image upload control matches the gallery button
- **WHEN** an editor views the cover-image field on any content form
- **THEN** the file-upload control SHALL visually match the adjacent "Kies uit galerij" button

#### Scenario: Chosen filename feedback
- **WHEN** an editor selects a file with the styled control
- **THEN** the control SHALL display the selected file's name

### Requirement: Social media icons
The design system SHALL provide a small set of inline-SVG icons for the supported social platforms (Instagram, Facebook, X/Twitter, LinkedIn, YouTube), usable as a shared component that renders only the platforms that have a URL. The icons SHALL not require any third-party scripts.

#### Scenario: Rendering a social icon row
- **WHEN** an item with one or more social media URLs is rendered
- **THEN** the shared component SHALL render an inline-SVG icon link for each set platform, using no third-party scripts
