# Spec Delta

## ADDED Requirements

### Requirement: Actionable controls signal they can be pressed
Every enabled button, element with the button role, and disclosure control SHALL show the pointing-hand cursor when hovered, on public pages and in the backend alike, and SHALL change its appearance on hover. A disabled control SHALL keep the default cursor. Links are unaffected and keep the pointer they already have.

#### Scenario: Hovering an enabled button
- **WHEN** a visitor or editor moves the mouse over an enabled button, including a hand-styled backend button
- **THEN** the cursor SHALL be the pointing hand and the button SHALL change its appearance

#### Scenario: Hovering a disabled button
- **WHEN** a visitor or editor moves the mouse over a disabled button
- **THEN** the cursor SHALL stay the default arrow

#### Scenario: Hovering a disclosure control
- **WHEN** a visitor or editor moves the mouse over a disclosure control such as the mobile menu toggle or an "i" guidance button
- **THEN** the cursor SHALL be the pointing hand
