## Why

The neighborhood lacks a single, attractive place to discover what is happening, who is organizing it, and where it takes place. Information about events is scattered across social media and word of mouth, which makes it hard for residents to find activities and hard for organizers to reach their audience. This change introduces a community event calendar web app that gives residents a fast, accessible overview of upcoming events and gives organizers and venues their own pages to showcase what they do.

## What Changes

- Introduce an **Event** content type (description, date/time, venue, organizer, optional featured image, recurrence) with venue and organizer selected from pre-populated drop-down lists.
- Introduce **Venue** and **Organiser** content types as durable, page-worthy entities, each with description, contact info (phone, email, website), media, and an automatically generated list of their upcoming events.
- Provide reusable **event listing/display** components: lists with and without featured images, embeddable on static pages and blog posts, shown at the bottom of Venue and Organiser pages, filtered to today + future, with a configurable limit and a "See more…" affordance.
- Give Organisers a **portfolio** showcase (image grid where items open a description + external link, or link to upcoming/recurring events).
- Add a **Blog** with posts listed in reverse chronological order.
- Store event/blog/venue/organiser content as **Markdown/MDX in S3**, with a caching policy tuned to read-heavy, infrequently-changing content.
- Provide an **editorial backend** for editors to create Events, Venues, Organisations, and blog posts, and to import events from a **Google Calendar or iCal** link.
- Add **user management**: administrators oversee all content; limited user accounts may submit events/blogs and maintain their own Organisation page. All submissions enter an **approval queue** before publication.
- Make the site **responsive and accessible** (smartphone/tablet/desktop), include an **EU cookie notification**, and provide a footer with table of contents, privacy statement, and required static content.
- Optimize for **SEO and GEO** (traditional and AI search engines) with strong performance, structured data, and discoverability as first-class priorities.
- Apply a **warm, friendly, accessible visual design** that is easy for a broad audience to consume.

## Capabilities

### New Capabilities
- `events`: Event entity (fields, venue/organizer relationships, recurrence) and its reusable listing/display behavior (with/without images, upcoming-only filtering, limit, "See more…", embedding on pages/posts/venue/organiser pages).
- `venues`: Venue entity with description, contact info, Google Map embed, image gallery, and an auto-generated list of upcoming events at that venue.
- `organisers`: Organiser entity with description, contact info, portfolio showcase, and an auto-generated list of that organiser's upcoming events.
- `blog`: Blog posts and a reverse-chronological blog listing page.
- `content-storage`: Markdown/MDX content persisted in S3 with a defined schema, build/render pipeline, and caching/invalidation policy.
- `editorial-backend`: Authenticated backend UI for creating and editing Events, Venues, Organisations, and blog posts.
- `calendar-import`: Importing events into the calendar from a Google Calendar or iCal (.ics) link.
- `user-roles-approval`: Roles (administrator, limited user/organiser editor) and an approval queue for event and blog submissions.
- `accessibility-compliance`: Responsive layout, WCAG-aligned accessibility, EU cookie notification, and the privacy/static-content footer.
- `seo-discoverability`: SEO and GEO optimization — metadata, structured data, sitemaps, performance budgets, and AI-search findability.
- `design-system`: Warm, friendly, accessible visual design language (color, typography, components) shared across the site.

### Modified Capabilities
<!-- None — this is a greenfield project with no existing specs. -->

## Impact

- **New application**: greenfield web app (no existing code in this repo). Establishes project scaffolding, build tooling, and deployment.
- **Storage**: S3 bucket(s) for MD/MDX content and media assets; a CDN/caching layer in front.
- **External integrations**: Google Maps (venue maps), Google Calendar / iCal import, EU cookie-consent tooling, and AI/search engine discoverability (sitemaps, structured data).
- **Auth & data**: user accounts, roles, and a moderation/approval workflow with associated persistence.
- **Cross-cutting**: accessibility, SEO/GEO, and the warm design system affect every page and component.
