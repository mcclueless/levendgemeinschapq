## ADDED Requirements

### Requirement: Admin chrome visual token
The design system SHALL define a distinct dark "ink" admin-chrome treatment — surface color, text color, and focus/hover/active states — used for management UI. This treatment SHALL be applied consistently to both the public contextual admin banner and the backend top bar, establishing a single visual language so that the dark chrome reliably signals "management mode" and is clearly distinct from the warm public palette.

#### Scenario: Shared treatment across surfaces
- **WHEN** the public admin banner and the backend top bar are rendered
- **THEN** both SHALL use the same dark ink admin-chrome treatment, visibly distinct from the public site's warm palette

#### Scenario: Backend reads as the backend
- **WHEN** an administrator is in the backend
- **THEN** the backend chrome SHALL be unmistakably distinct from the public site so it is always clear which context they are in
