## 1. Project scaffolding & foundations

- [x] 1.1 Initialize Next.js (App Router) + TypeScript project with linting, formatting, and CI
- [x] 1.2 Set up the warm design-system tokens (color palette, typography scale) with AA-contrast verification
- [x] 1.3 Create the base layout, responsive shell, header, and site-wide footer (TOC/nav, privacy link, static content)
- [x] 1.4 Scaffold the shared component library (cards, buttons, forms, galleries, listing primitives)
- [x] 1.5 Add a Lighthouse/Core Web Vitals performance + accessibility budget check to CI

## 2. Content storage & rendering pipeline

- [x] 2.1 Provision S3 content and media buckets and the CDN, with config/env wiring _(code + env wiring + local-FS/S3 backends done; actual bucket/CDN provisioning is a deploy-time step needing AWS credentials)_
- [x] 2.2 Define Zod frontmatter schemas for Event, Venue, Organiser, and Blog content types
- [x] 2.3 Implement S3 read/write helpers for MD/MDX documents under per-type prefixes
- [x] 2.4 Build the MDX render pipeline that resolves Venue/Organiser references to links
- [x] 2.5 Build the derived index (dates, references, publication state, calendar UIDs) with a full reindex command
- [x] 2.6 Implement ISR + CDN caching with publish-time revalidation/invalidation of affected pages

## 3. Events domain

- [x] 3.1 Implement the Event model, frontmatter, and Venue/Organiser reference resolution
- [x] 3.2 Implement recurrence rules (weekly/monthly + end date) and next-occurrence expansion in the index
- [x] 3.3 Build the reusable upcoming-events listing (today+future, soonest first, configurable limit, "See more…")
- [x] 3.4 Build listing variants: with featured images and text-only (with graceful no-image fallback)
- [x] 3.5 Make listings embeddable on static pages and blog posts
- [x] 3.6 Build the single event page (description, date/time, featured image, Venue/Organiser links)

## 4. Venues domain

- [x] 4.1 Implement the Venue model and frontmatter (description, phone/email/website, address/coordinates, images)
- [x] 4.2 Build the Venue page with contact info and image gallery
- [x] 4.3 Add the consent-gated Google Map embed (placeholder until cookie consent)
- [x] 4.4 Show upcoming events at the venue at the bottom of the Venue page

## 5. Organisers domain

- [x] 5.1 Implement the Organiser model and frontmatter (description, phone/email/website)
- [x] 5.2 Build the Organiser page giving each organiser a page representing them
- [x] 5.3 Implement the portfolio grid with item view (description + external link, or link to an event)
- [x] 5.4 Show upcoming events for the organiser at the bottom of the Organiser page

## 6. Blog

- [x] 6.1 Implement the Blog post model and frontmatter (title, body, date, author, featured image)
- [x] 6.2 Build the reverse-chronological blog listing (published only)
- [x] 6.3 Build the single blog post page with embeddable event listings

## 7. Authentication, roles & approval workflow

- [x] 7.1 Integrate email-based auth (Auth.js) with sign-in/sign-out _(interim: single-admin password + signed JWT session/middleware per design D6 interim note; Auth.js magic-link/SES deferred)_
- [x] 7.2 Implement Administrator and Limited User roles and permission checks _(Administrator role + route/action guards done; Limited User role deferred with interim auth)_
- [ ] 7.3 Implement Organisation ownership linking Limited Users to the Organisation pages they maintain _(deferred — depends on multi-user auth; not in interim scope)_
- [x] 7.4 Implement pending/published content state in frontmatter + index
- [x] 7.5 Build the admin approval queue (list pending items with type/submitter/date; approve/reject)
- [x] 7.6 Wire approval to publish + trigger revalidation; record rejections for submitters

## 8. Editorial backend

- [x] 8.1 Build the authenticated backend shell with route protection (no unauthenticated access)
- [x] 8.2 Build create/edit forms for Events (with Venue/Organiser drop-downs), Venues, Organisations, and Blog posts _(create forms done; in-place edit of existing items is a follow-up)_
- [x] 8.3 Implement media upload to the S3 media bucket with association to content _(featured-image upload for events/blog; S3 in prod, local public/uploads fallback)_
- [x] 8.4 Implement draft save and submit-for-review (public submissions route to the queue)

## 9. Calendar import

- [x] 9.1 Build the import action that fetches and validates a Google Calendar / iCal URL
- [x] 9.2 Parse VEVENTs and map fields (summary/description/start/end/location), interpreting RRULE as recurrence
- [x] 9.3 Dedupe imports by calendar UID against the index; flag unmatched venues/organisers for assignment
- [x] 9.4 Route imported events into the approval queue as pending

## 10. Accessibility, SEO/GEO & compliance

- [x] 10.1 Implement the EU cookie notification with consent gating of all non-essential scripts/cookies
- [x] 10.2 Add per-page metadata (unique title/description + Open Graph/Twitter) via the Metadata API
- [x] 10.3 Add schema.org JSON-LD: Event, Place, Organization, BlogPosting
- [x] 10.4 Generate the XML sitemap and robots directives (backend disallowed from indexing)
- [x] 10.5 Run an accessibility pass (keyboard, focus, contrast, alt text) to WCAG 2.1 AA across pages
- [x] 10.6 Author privacy statement and required static pages/content for the footer

## 11. Seed, verify & launch

- [x] 11.1 Seed initial Venues and Organisers and sample Events/Blog posts
- [x] 11.2 Verify end-to-end flows: submit → approve → publish → appears in listings and on venue/organiser pages _(verified via e2e script + runtime smoke tests; full UI click-through recommended before launch)_
- [ ] 11.3 Verify performance/a11y budgets and structured data with live tooling _(structured data verified live; Lighthouse budgets configured in CI but a live audit needs a deploy/CI run)_
- [ ] 11.4 Configure the canonical domain + redirects and deploy to production _(deploy-time: needs AWS/domain credentials)_
