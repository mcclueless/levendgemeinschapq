## MODIFIED Requirements

### Requirement: Homepage section order
The homepage SHALL present its sections in a fixed top-to-bottom order:
introductory split panel, upcoming-events listing, the three pillars, the tagline
separator, the projects listing, the who-we-are organiser grid, the photographic
band, and the footer. The introductory heading, supporting text, and
call-to-action labels, and the titles, limits, ordering, and empty states of the
projects listing, SHALL be preserved unchanged from before this change. The
upcoming-events listing SHALL keep its title, ordering, and empty state; its
number of events follows the switchable-view requirement of the events
capability.

#### Scenario: Sections render in order
- **WHEN** a visitor opens the homepage
- **THEN** the system SHALL render the sections in the order: introduction,
  upcoming events, pillars, tagline separator, projects, who we are, photographic
  band, footer

#### Scenario: Existing listings behave as before
- **WHEN** the homepage renders its upcoming-events and projects listings
- **THEN** the projects listing SHALL present the same items, in the same order,
  with the same title, limit, and empty state as before this change, and the
  upcoming-events listing SHALL keep its title, soonest-first ordering, and empty
  state

#### Scenario: Upcoming events start at six within 90 days
- **WHEN** a visitor opens the homepage without view parameters
- **THEN** the upcoming-events listing SHALL show at most the six soonest
  occurrences from today through the next 90 days, as cards

#### Scenario: Existing hero wording is preserved
- **WHEN** the homepage renders its introductory panel
- **THEN** its heading, supporting paragraph, and call-to-action labels SHALL read
  exactly as they did before this change
