## ADDED Requirements

### Requirement: Events that lead to an external page
An Event MAY lead to an external web page instead of having its own page on the site. Such an event SHALL appear in every upcoming-events listing that shows events by date, as an ordinary event does, with its image, date and time, and its Venue and Organisers when given. Its entry in a listing SHALL link to the external page, SHALL show a visible mark that the link leads to another site, and SHALL give assistive technology the name of that site. The link SHALL open in the same browser tab.

Such an event SHALL NOT have a page on the site: its address SHALL return "not found", it SHALL NOT appear in the sitemap, and the site SHALL publish no structured data for it. The external address SHALL be an http or https address.

#### Scenario: An external event in the agenda
- **WHEN** a visitor views the agenda and an upcoming event leads to an external page
- **THEN** the event SHALL be listed by its date with its image, time, and title, and its entry SHALL link to the external page

#### Scenario: The link is marked as leaving the site
- **WHEN** an external event's entry is shown in any listing variant
- **THEN** the entry SHALL show a mark that it leads to another site, and its link SHALL tell assistive technology which site it opens

#### Scenario: No page on the site
- **WHEN** anyone opens the site's own address for an external event
- **THEN** the site SHALL respond "not found", and the sitemap SHALL NOT list that address

#### Scenario: Listed with its organiser
- **WHEN** an external event has an Organiser or a Venue
- **THEN** it SHALL appear in that Organiser's or Venue's event list, linking to the external page

#### Scenario: Ordinary events and markers unchanged
- **WHEN** an event has its own page, or is an agenda marker without a page
- **THEN** it SHALL be listed and linked exactly as before this change
