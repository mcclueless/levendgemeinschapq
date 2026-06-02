## Context

Greenfield project: there is no existing application code in this repository. The goal is a public, fast, accessible community event calendar with Events, Venues, Organisers, and a Blog, plus an editorial backend with a submission/approval workflow and calendar import. The brief specifies content stored as Markdown/MDX in S3, a caching policy tuned to the workload, strong SEO/GEO and performance, an EU cookie notice, and a warm, friendly, accessible design built with the Claude frontend tooling.

The workload is **read-heavy and write-light**: many residents browsing, a handful of editors publishing occasionally. Content changes infrequently relative to reads. This shape favors static generation + CDN caching over a per-request database-backed render.

Stakeholders: neighborhood residents (primary readers), event organisers (own pages + submissions), site administrators (oversight + approval), and editors.

## Goals / Non-Goals

**Goals:**
- A fast, SEO/GEO-strong public site where upcoming events, venues, and organisers are easy to find and scan.
- Content authored and stored as MD/MDX in S3 as the source of truth, with typed frontmatter per content type.
- Reusable event-listing components (with/without images, upcoming-only, limit + "See more…") embeddable across pages, posts, venue, and organiser pages.
- An authenticated backend for editors with a submission → approval → publish workflow, plus Google Calendar / iCal import.
- WCAG 2.1 AA accessibility, responsive across phone/tablet/desktop, EU cookie consent, and a privacy/static footer.
- A warm, friendly, token-driven design system.

**Non-Goals:**
- Paid ticketing, payments, or RSVP/attendance management.
- A general-purpose drag-and-drop page builder (deferred; pages are composed from MDX + components, not a visual builder).
- Native mobile apps.
- Real-time/live features.
- Newsletter integration (not in this round's scope; can be a later change).

## Decisions

### D1 — Framework: Next.js (App Router) + TypeScript, statically generated
**Choice:** Next.js with the App Router, React Server Components, TypeScript, rendered as static/ISR pages.
**Why:** Best-in-class SEO (server-rendered HTML, metadata API), first-class MDX support, image optimization, and incremental static regeneration that matches read-heavy/write-light content. Server Components keep client JS small for performance/Core Web Vitals. Aligns with the "Claude frontend plugin" / React tooling expectation.
**Alternatives:** Astro (excellent for content sites, but the authenticated backend + dynamic listings are more idiomatic in Next); plain SPA (poor SEO/GEO — rejected); WordPress/SaaS CMS (rejected per the custom-build direction).

### D2 — Content as MD/MDX in S3 (source of truth) with typed frontmatter
**Choice:** Each Event/Venue/Organiser/Blog item is one MD/MDX document in S3 under a per-type prefix (e.g. `events/`, `venues/`, `organisers/`, `blog/`). Frontmatter holds typed fields; Venue/Organiser are referenced by slug/ID. Frontmatter is validated with a schema (Zod) at read/build time.
**Why:** Matches the brief, keeps content portable and diffable, and lets the build resolve relationships and generate static pages. Referencing venues/organisers by ID keeps the drop-down model consistent.
**Alternatives:** Database-only content (rejected — brief wants MD/MDX in S3); Git-based MDX in-repo (rejected — editors need a backend and non-repo storage).

### D3 — A lightweight index alongside S3 for queries
**Choice:** Maintain a derived index (event dates, venue/organiser references, publication state, calendar UIDs) so listings ("upcoming, soonest first, limit N", "events at venue X", "events by organiser Y", dedup on import) are cheap. The index is rebuilt/updated on publish; it is a cache, not the source of truth.
**Why:** Scanning all S3 objects per request is slow; recurrence expansion and "upcoming" filtering need a queryable view. Keeping S3 authoritative preserves D2.
**Alternatives:** Query S3 directly each time (too slow, rejected); make the DB authoritative (conflicts with D2).

### D4 — Hosting: AWS-native, with CDN + ISR and publish-time invalidation
**Choice (decided):** Host on **AWS**, keeping everything in one cloud next to the S3 content/media buckets. Deploy Next.js via **OpenNext on CloudFront + Lambda** (or AWS Amplify Hosting) for native ISR/on-demand revalidation and edge caching. Public pages are served from CloudFront; on publish/update we revalidate affected pages (the changed item plus its listings, venue, and organiser pages) and issue a CloudFront invalidation for those paths. The backend is never cached.
**Why:** S3 is already the source of truth, so staying AWS-native keeps IAM, networking, and billing in one place and avoids a second vendor.
**Alternatives considered:** Vercel — simplest Next.js ISR path, but adds a second vendor; not chosen (AWS preferred).
**Trade-off:** More invalidation/infra wiring than a managed platform; a short, bounded staleness window after publish — acceptable for this content.

### D5 — Recurrence handled via rules, expanded into occurrences at index time
**Choice:** Store recurrence as a rule (RRULE-compatible: weekly/monthly, optional end date) on the event. The indexer expands the next future occurrence(s) for listings rather than materializing every event as a separate document.
**Why:** Keeps one document per logical event, supports "shows up every week/month", and maps cleanly to imported iCal RRULEs.
**Alternatives:** Materialize each occurrence as its own file (storage bloat, hard to edit — rejected).

### D6 — Auth, roles, and the approval queue
**Choice (decided):** **Magic-link email** authentication (Auth.js Email provider), with sign-in emails delivered through **Amazon SES** (consistent with the AWS-native hosting in D4). Two roles — Administrator and Limited User — and an ownership link from Limited Users to the Organisation(s) they maintain. Submissions from Limited Users are written in a `pending` state and listed in an admin queue; approval flips state to `published` and triggers D4 revalidation.
**Why:** Passwordless magic links are the gentlest sign-in for a community of varied technical skill, remove password-management/breach risk, and need no password reset flows. SES keeps email in AWS.
**Interim implementation (build decision):** The first implementation ships with a **single Administrator** authenticated by an env password (signed JWT session cookie via `jose`), protecting `/beheer`. Public submissions enter the approval queue without login. Multi-user accounts, the Limited User role, organiser-page ownership, and magic-link/SES are deferred to a follow-up and replace this admin-only auth before those features go live.
**Alternatives considered:** Google OAuth (one-click, but assumes everyone uses Google — can be added later as a second provider); passwords (reset/breach burden — rejected); full external IAM (overkill).

### D7 — Calendar import (Google Calendar / iCal)
**Choice:** A backend action fetches the .ics/Google feed, parses VEVENTs (ical parsing lib), maps fields (summary→title, dtstart/dtend→date/time, location→venue hint, RRULE→recurrence), dedupes on calendar UID against the index, and writes imported events as `pending` for review. Unmatched venues/organisers are flagged for assignment.
**Why:** Standard, dependency-light, and routes through the same approval gate as manual submissions.
**Alternatives:** Live two-way calendar sync (out of scope, rejected).

### D8 — Maps and media
**Choice:** Google Maps embed on venue pages from stored address/coordinates (loaded only after cookie consent for non-essential scripts). Images uploaded to an S3 media bucket and served via the CDN with Next image optimization; venue galleries and organiser portfolios use the shared component library.
**Why:** Meets the map + gallery + portfolio requirements while respecting the EU cookie consent gate.

### D9 — Accessibility, SEO/GEO, and design system as cross-cutting foundations
**Choice:** Token-driven warm theme (CSS variables / Tailwind config) with AA contrast; semantic HTML; Next Metadata API for per-page titles/OG; schema.org JSON-LD (Event/Place/Organization/BlogPosting); generated sitemap + robots (backend disallowed); performance budget enforced in CI (Lighthouse). GEO/AI findability comes from clean semantic markup + structured data exposing what/when/where/who.
**Why:** These are requirements in their own specs and must be built in from the start, not retrofitted.

### D10 — Build the design system with the `frontend-design` plugin, steered warm + accessible
**Choice (decided):** Use Anthropic's **`frontend-design`** Claude Code skill (installed locally) to author the design system and components. This is a build-time authoring aid, **not** a runtime dependency shipped to visitors — it produces ordinary React/CSS code.
**Steering caveat:** The skill is biased toward *bold/maximalist, "unforgettable"* aesthetics, whereas this brief wants *warm, friendly, simple, easy to consume for a broad audience*. We deliberately steer it toward a **refined-warm** direction (inviting palette, characterful but legible typography, restrained motion) and treat **WCAG 2.1 AA contrast and keyboard operability as hard constraints** that override any aesthetic suggestion. The plugin's distinctive-typography guidance is welcome as long as body text stays highly legible.
**Why:** Gets a polished, non-generic look that still serves accessibility and the community audience.

## Risks / Trade-offs

- **S3-as-source + derived index can drift** → Treat the index as rebuildable from S3; provide a full reindex command and rebuild on publish so S3 stays authoritative.
- **Recurrence + timezone edge cases** (DST, monthly-by-date vs by-weekday) → Constrain v1 to weekly/monthly with explicit end dates; store and compute in a fixed timezone (Europe/Amsterdam); add tests for boundary cases.
- **Import data quality** (unmatched venues, malformed feeds, duplicates) → All imports land in `pending` with validation + UID dedup; editors confirm venue/organiser before publish.
- **Cookie consent vs Google Maps/analytics** → Gate all non-essential third-party scripts behind consent; render a consent-required placeholder for maps until accepted.
- **Static caching vs freshness after approval** → Targeted ISR revalidation + CDN invalidation on publish keeps the staleness window short and bounded.
- **Backend write path to S3 needs care** (consistency, partial writes) → Write document then update index in a defined order; validate frontmatter before write; treat failed index update as a retryable job.

## Migration Plan

Greenfield, so "migration" is initial rollout:
1. Scaffold Next.js + TypeScript app, design tokens, and component library shell.
2. Provision S3 content + media buckets and CDN; define frontmatter schemas (Zod) per type.
3. Build read/render pipeline (S3 → MDX → pages) and the derived index + reindex command.
4. Implement public surfaces: events (+ reusable listings), venue, organiser, blog, static pages, footer.
5. Implement auth, roles, ownership, backend forms, and the approval queue.
6. Implement calendar import.
7. Layer cross-cutting: cookie consent, SEO/GEO metadata + structured data + sitemap, performance/a11y budgets in CI.
8. Seed initial venues/organisers; launch behind `levendegemeenschap.nl` (canonical) with `levende-gemeenschap.nl` and `levgem.nl` 301-redirecting to it.
Rollback: greenfield with no legacy data; redeploy a previous build and (if needed) restore S3 content from versioning.

## Resolved Decisions

All initial open questions are now resolved:

- **Canonical domain:** `levendegemeenschap.nl` is canonical; `levende-gemeenschap.nl` and `levgem.nl` 301-redirect to it. (See migration step 8.)
- **Hosting target:** **AWS-native** (CloudFront + Lambda via OpenNext, or Amplify Hosting), next to the S3 buckets. (See D4.)
- **Auth method:** **Magic-link email** via Auth.js, delivered through Amazon SES. Google OAuth may be added later. (See D6.)
- **`frontend-design` plugin:** Confirmed as a **build-time authoring aid** (Anthropic Claude Code skill), not a runtime dependency. Used to build the design system, steered toward a refined-warm aesthetic with WCAG AA as a hard constraint. (See D10.)
- **Content language & i18n:** **Dutch-only** at launch. Internationalization (locale routing, translations) is out of scope for this change.
- **Portfolio item source:** Portfolio items are a **frontmatter list on the Organiser document** (`{image, description, externalUrl | eventRef}`), not separate MDX files. Can be promoted to separate documents later if portfolios grow rich.
- **Newsletter:** **Out of scope** for this change (listed under Non-Goals); can be added later as a focused `newsletter` capability.

## Open Questions

- None outstanding. New questions that surface during implementation will be added here.
