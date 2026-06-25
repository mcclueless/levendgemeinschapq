## ADDED Requirements

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
