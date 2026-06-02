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
