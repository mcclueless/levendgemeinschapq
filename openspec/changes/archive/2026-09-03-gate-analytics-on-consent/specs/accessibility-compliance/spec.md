## MODIFIED Requirements

### Requirement: EU cookie notification and consent
The site SHALL present an EU cookie notification and SHALL NOT set non-essential cookies or load non-essential trackers until the visitor has consented.

Withholding a non-essential third party SHALL mean not loading it at all: the
system SHALL NOT request the third party's script, so that no contact is made with
it and no cookie of its is set, rather than loading it in a suppressed mode.

Consent SHALL be recorded per category of non-essential use rather than as a single
switch, and the visitor SHALL be able to allow one category while declining
another. The controls the site offers for reviewing consent SHALL report the
categories the visitor has actually allowed.

The site's published cookie policy SHALL describe each category of non-essential
cookie or tracker the site uses.

#### Scenario: Consent gate for non-essential cookies
- **WHEN** a first-time visitor loads the site
- **THEN** the system SHALL display a cookie notice and SHALL withhold non-essential cookies/trackers until consent is given

#### Scenario: Respecting a decline
- **WHEN** a visitor declines non-essential cookies
- **THEN** the system SHALL operate using only essential cookies and SHALL remember the choice

#### Scenario: A withheld tracker is never requested

- **WHEN** a visitor who has not consented to a non-essential tracker loads any page
- **THEN** the page SHALL contain no reference that would cause that tracker to be
  fetched, and the system SHALL make no request to it

#### Scenario: Allowing one category and declining another

- **WHEN** a visitor allows one category of non-essential use and declines another
- **THEN** the system SHALL honour each independently, enabling only what was
  allowed

#### Scenario: Consent controls report the real choice

- **WHEN** a visitor reviews their cookie preferences after choosing
- **THEN** the controls SHALL name the categories they have allowed, and SHALL NOT
  report a category's state on the basis of a different category

#### Scenario: The policy covers what the site uses

- **WHEN** the site uses a non-essential cookie or tracker
- **THEN** its published cookie policy SHALL describe that category of use
