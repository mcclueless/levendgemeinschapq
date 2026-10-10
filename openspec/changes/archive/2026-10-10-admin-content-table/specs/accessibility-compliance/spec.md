## MODIFIED Requirements

### Requirement: Admin chrome accessibility
The dark admin-chrome surfaces (the public contextual banner and the backend navigation) SHALL meet WCAG 2.1 AA on their own terms. Text and actionable controls on the ink surface SHALL meet the AA contrast ratio against that dark background, interactive controls SHALL show a visible keyboard focus indicator that is perceivable against the dark surface, and hover/active states SHALL remain distinguishable on the dark background. The entry for the current section SHALL be distinguishable from the other entries by more than color alone.

#### Scenario: Contrast on the dark chrome
- **WHEN** text or controls are rendered on the dark admin chrome
- **THEN** they SHALL meet the WCAG AA contrast ratio against the ink background

#### Scenario: Visible focus on the dark chrome
- **WHEN** a user navigates the admin chrome controls by keyboard
- **THEN** each focused control SHALL show a focus indicator that is clearly perceivable against the dark surface

#### Scenario: The current section on the dark chrome
- **WHEN** the backend navigation marks the current section
- **THEN** the mark SHALL be perceivable without relying on color alone
