## ADDED Requirements

### Requirement: Event share previews carry when, where and what

An event page SHALL provide social-sharing metadata sufficient for a messaging or
social client to present the event's date, time, recurrence, venue and summary
without the reader opening the link.

The social description SHALL lead with the event's date, followed by its time,
followed by a description of its recurrence when the event repeats, followed by the
event's summary text. Because clients truncate a description after a short,
client-determined length, the system SHALL place these elements in that order so
that the summary is the element lost to truncation.

The social title SHALL carry the event's title together with its venue name.

Any element whose source value is absent SHALL be omitted together with its
separator, leaving the remaining elements correctly punctuated.

#### Scenario: Recurring event's share description

- **WHEN** a recurring event's page is rendered
- **THEN** the social description SHALL begin with the event's date and time,
  SHALL then state how often the event repeats, and SHALL then carry the event's
  summary text

#### Scenario: Non-recurring event's share description

- **WHEN** a non-recurring event's page is rendered
- **THEN** the social description SHALL begin with the event's date and time,
  SHALL contain no recurrence statement, and SHALL then carry the event's summary
  text

#### Scenario: Share title carries the venue

- **WHEN** an event with a venue is rendered
- **THEN** the social title SHALL contain both the event's title and its venue name

#### Scenario: Event without a venue

- **WHEN** an event that has no venue is rendered
- **THEN** the social title SHALL be the event's title alone, with no trailing
  separator

#### Scenario: Event without summary text

- **WHEN** an event that has no summary text is rendered
- **THEN** the social description SHALL carry the date, time and recurrence
  elements alone, with no trailing separator

### Requirement: A share preview's date matches the page it opens

The date carried in an event's social-sharing metadata SHALL be the same occurrence
the event's own page presents to a visitor, so that a shared preview never
advertises a date that differs from the page reached by following it.

#### Scenario: Recurring event whose stored start has passed

- **WHEN** a recurring event whose stored start is in the past, but which still
  recurs, is rendered
- **THEN** the date in its social-sharing metadata SHALL be the same upcoming
  occurrence shown on the event's page, and SHALL NOT be the past stored start

### Requirement: Social image dimensions are declared

Social-sharing metadata SHALL declare the intended width and height of the sharing
image alongside its URL, so that a client can present a large preview card rather
than selecting a small thumbnail on its own.

#### Scenario: Page with a sharing image

- **WHEN** a page that carries a social-sharing image is rendered
- **THEN** the system SHALL emit the image's declared width and height together
  with its URL
