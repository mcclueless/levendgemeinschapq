# homepage Specification

## Purpose

Defines the homepage's visual composition — its split photo/colour panel structure, the duotone wash applied to its neighbourhood photography, and the contrast and performance constraints that treatment must satisfy — while leaving its wording and listings untouched. `projects` defines where the homepage projects section sits and `content-storage` defines how the page is rendered; this capability defines what the page looks like.

## Requirements

### Requirement: Photographic split panels on the homepage
The homepage SHALL present its introductory content and its projects section as split panels, each pairing a photograph with an adjacent flat colour panel carrying the text. The photographs SHALL depict the neighbourhood the site serves.

#### Scenario: Homepage presents its photography
- **WHEN** a visitor opens the homepage
- **THEN** the system SHALL render a photographic panel alongside the introductory heading and call-to-action, and a further photographic panel with the projects section

#### Scenario: Panels adapt to narrow screens
- **WHEN** the homepage is viewed on a narrow screen
- **THEN** the system SHALL present the panel content without horizontal overflow and without obscuring any text

### Requirement: Homepage photography is tinted to the site palette
Photographs on the homepage SHALL be presented with a colour wash drawn from the site's existing palette, so that photographs of differing origin and quality read as one deliberate treatment. The homepage SHALL NOT introduce colours outside the established palette.

#### Scenario: Photographs are washed, not raw
- **WHEN** the homepage renders a photographic panel
- **THEN** the photograph SHALL be tinted with the site's brand colour rather than shown untreated

#### Scenario: Palette is unchanged elsewhere
- **WHEN** any page other than the homepage is rendered
- **THEN** its appearance SHALL be unchanged by this treatment, and the shared palette tokens SHALL be unmodified

### Requirement: Text over homepage imagery meets contrast requirements
Every text and background pairing on the homepage SHALL meet WCAG 2.1 AA contrast, including where text is presented over or adjacent to a photograph. Because a photograph's luminance is not fixed, the system SHALL guarantee the local background behind such text rather than relying on the colour wash alone.

#### Scenario: Text over a photograph remains legible
- **WHEN** homepage text is presented over a photographic area
- **THEN** the system SHALL provide a deterministic background treatment behind that text sufficient to meet AA contrast, regardless of the underlying image

#### Scenario: Automated accessibility checks continue to pass
- **WHEN** the homepage is audited by the project's automated accessibility checks
- **THEN** it SHALL meet the configured accessibility threshold

### Requirement: Homepage imagery is served within the performance budget
Homepage photographs SHALL be served as locally hosted, appropriately sized assets in modern image formats, with intrinsic dimensions declared so that loading them causes no layout shift. The homepage SHALL NOT load its decorative photography from an external site.

#### Scenario: Images do not shift the layout
- **WHEN** the homepage loads and its photographs arrive
- **THEN** the page SHALL NOT shift its layout, and SHALL remain within the project's configured cumulative-layout-shift budget

#### Scenario: Photography is self-hosted
- **WHEN** the homepage renders its photographs
- **THEN** the system SHALL serve them from this site's own assets and SHALL NOT reference a third-party or predecessor site

#### Scenario: Each photograph keeps its intended framing
- **WHEN** a homepage photograph is cropped to fit its panel
- **THEN** the system SHALL position the crop so the photograph's subject remains visible

### Requirement: Homepage content and wording are unchanged by presentation
Restyling the homepage SHALL NOT alter its wording or the content it presents. The introductory heading, supporting text, call-to-action labels, and the titles and limits of the upcoming-events and projects sections SHALL be preserved.

#### Scenario: Wording is preserved
- **WHEN** the restyled homepage is rendered
- **THEN** its heading, supporting paragraph, call-to-action labels, and section titles SHALL read exactly as they did before

#### Scenario: Listings behave as before
- **WHEN** the restyled homepage renders its upcoming-events and projects sections
- **THEN** those sections SHALL present the same items, in the same order, with the same limits and empty states as before
