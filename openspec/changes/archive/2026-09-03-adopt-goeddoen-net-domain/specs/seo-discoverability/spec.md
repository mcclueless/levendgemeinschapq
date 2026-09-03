## ADDED Requirements

### Requirement: One canonical origin

The site SHALL have a single canonical origin, and every absolute URL it generates —
canonical link tags, social-sharing URLs, sitemap entries, crawler directives, and
structured data — SHALL use that origin. The origin SHALL be configurable per
deployment rather than fixed in code, and SHALL be served over HTTPS.

The site MAY remain reachable at additional hostnames, such as a hosting provider's
generated address. Where it is, those hostnames SHALL serve the same content and
SHALL present the canonical origin in their canonical link tags, so that alternative
hostnames do not compete with the canonical one for the same content.

#### Scenario: Generated URLs share one origin

- **WHEN** the site renders a canonical link tag, a social-sharing URL, a sitemap
  entry, or structured data containing an absolute URL
- **THEN** every such URL SHALL use the configured canonical origin

#### Scenario: Reaching the site by an alternative hostname

- **WHEN** a page is requested by a hostname other than the canonical origin, and
  that hostname serves the site
- **THEN** the response SHALL carry a canonical link tag naming the canonical origin,
  and SHALL NOT name the hostname through which it was reached

#### Scenario: Origin is deployment configuration

- **WHEN** the canonical origin is changed for a deployment
- **THEN** every generated absolute URL SHALL follow it without any change to
  application code

### Requirement: The www hostname redirects to the canonical origin

Where the canonical origin is a bare domain, the corresponding `www` hostname SHALL
redirect to it rather than serving the site in parallel, so that one address is
unambiguously the site's own.

#### Scenario: Visiting the www hostname

- **WHEN** a visitor requests the site's `www` hostname
- **THEN** the system SHALL redirect them to the same path on the canonical origin

### Requirement: Published contact addresses and identifiers are real

Every address the site offers as a way of contacting the site itself SHALL use a
domain the site controls, and so SHALL every contact detail it sends to a
third-party service whose usage policy requires one. The site SHALL NOT offer its
own contact address on a domain that does not exist.

This governs the site speaking as itself. Contact details belonging to the people
and organisations the site publishes — an organiser's or venue's own address — are
content, are expected to be on domains the site does not control, and are outside
this requirement.

#### Scenario: Contact address on a public page

- **WHEN** a public page offers an address for contacting the site
- **THEN** that address SHALL be on a domain the site controls

#### Scenario: Identifying the application to a third-party service

- **WHEN** the system calls a third-party service whose usage policy requires an
  identifying contact
- **THEN** it SHALL send a contact on a domain the site controls, so that the service's
  operators can reach whoever is generating the traffic
