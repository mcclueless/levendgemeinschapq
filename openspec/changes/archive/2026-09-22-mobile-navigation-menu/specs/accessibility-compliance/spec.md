## ADDED Requirements

### Requirement: Primary navigation on small screens
Where the header's horizontal navigation is not shown because the viewport is too narrow, the header SHALL provide a control that reveals the same primary navigation entries, together with any header call to action hidden at that width. The control SHALL be reachable and operable by keyboard, SHALL be labelled, and SHALL report whether the navigation is currently revealed. The revealed navigation SHALL close when a visitor follows one of its links, presses Escape, or activates something outside it, and closing SHALL leave keyboard focus on the control. The control SHALL NOT depend on JavaScript to reveal the navigation.

#### Scenario: Reaching every navigation entry on a phone
- **WHEN** a visitor opens any page at a phone width and activates the header's menu control
- **THEN** the system SHALL reveal every primary navigation entry and the "Evenement indienen" call to action, each linking to its page

#### Scenario: The control reports its state
- **WHEN** the menu control is rendered
- **THEN** it SHALL carry an accessible name and SHALL report whether the navigation is revealed, updating that state when it is opened or closed

#### Scenario: Keyboard operation
- **WHEN** a visitor reaches the menu control by keyboard and activates it
- **THEN** the navigation SHALL open, its links SHALL be reachable by continuing to move focus, and pressing Escape SHALL close it and return focus to the control

#### Scenario: Closing on navigation
- **WHEN** a visitor follows a link from the revealed navigation
- **THEN** the system SHALL close it, so it does not stay open over the page that was opened

#### Scenario: Closing on an outside click
- **WHEN** the navigation is revealed and the visitor activates something outside it
- **THEN** the system SHALL close it

#### Scenario: Without JavaScript
- **WHEN** a visitor without JavaScript activates the menu control
- **THEN** the navigation SHALL still be revealed

#### Scenario: Wide viewports are unaffected
- **WHEN** a page is viewed at a width where the horizontal navigation is shown
- **THEN** the menu control SHALL NOT be shown, and the navigation SHALL render as before

## MODIFIED Requirements

### Requirement: Responsive layout
The site SHALL be responsive and usable on smartphone, tablet, and desktop viewports, with no horizontal scrolling or clipped content at common breakpoints. The primary navigation SHALL remain reachable from the header at every viewport width, whether shown in full or behind a control that reveals it.

#### Scenario: Rendering across devices
- **WHEN** any public page is viewed on a phone, tablet, or desktop width
- **THEN** the system SHALL present a layout adapted to that viewport without broken or clipped content

#### Scenario: Navigation reachable at every width
- **WHEN** any public page is viewed at a width where the header's horizontal navigation is not shown
- **THEN** the header SHALL still offer a way to reach every primary navigation entry
