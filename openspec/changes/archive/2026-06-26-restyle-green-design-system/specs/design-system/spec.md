## MODIFIED Requirements

### Requirement: Green, accessible color palette
The site SHALL use a green, cool-neutral color palette applied consistently via **semantic** design tokens (e.g. brand, brand-strong, accent, canvas, surface, fg, muted), and every text/background pairing SHALL meet WCAG 2.1 AA contrast. Token names SHALL describe their role rather than a literal hue.

#### Scenario: Consistent themed surfaces
- **WHEN** any page or component is rendered
- **THEN** the system SHALL apply the shared green palette tokens and SHALL maintain AA-contrast text

#### Scenario: Brand colour carries text accessibly
- **WHEN** brand-coloured text appears on a light surface, or white text appears on a brand fill
- **THEN** the pairing SHALL meet WCAG 2.1 AA (≥4.5:1 for normal text)

### Requirement: Typography and readability
The site SHALL define a typographic scale with legible font sizes and line lengths tuned for easy reading by a broad audience. Headings and body SHALL use a single sans-serif family (no serif display face); headings SHALL use a heavier weight to establish hierarchy.

#### Scenario: Readable body text
- **WHEN** body content is rendered
- **THEN** the system SHALL apply the defined typographic scale with a comfortable reading measure and line height

#### Scenario: Sans-serif headings
- **WHEN** a heading is rendered
- **THEN** the system SHALL render it in the sans-serif family at a heavier weight, with no serif display face

### Requirement: Admin chrome visual token
The design system SHALL define a distinct dark admin-chrome treatment — surface color, text color, and focus/hover/active states — used for management UI. This treatment SHALL be applied consistently to both the public contextual admin banner and the backend top bar, establishing a single visual language so that the dark chrome reliably signals "management mode" and is clearly distinct from the public palette. The chrome SHALL be cool/green-tinted so it stays cohesive with the green public palette while remaining unmistakably a management surface, and its on-chrome pairings SHALL meet WCAG 2.1 AA.

#### Scenario: Shared treatment across surfaces
- **WHEN** the public admin banner and the backend top bar are rendered
- **THEN** both SHALL use the same dark admin-chrome treatment, visibly distinct from the public site's palette

#### Scenario: Backend reads as the backend
- **WHEN** an administrator is in the backend
- **THEN** the backend chrome SHALL be unmistakably distinct from the public site so it is always clear which context they are in

## RENAMED Requirements

- FROM: `### Requirement: Warm, accessible color palette`
- TO: `### Requirement: Green, accessible color palette`
