## Why

The site catalogues what *happens* in the neighbourhood (events) and who/where
makes it happen (organisers, locations), but has no home for ongoing or
completed neighbourhood **initiatives** — community gardens, renovation efforts,
art projects. These are durable, multi-organiser undertakings tied to a place,
which don't fit the dated, single-organiser event model. A dedicated
"Projecten" content type gives them a first-class place alongside the existing
content types.

## What Changes

- Introduce a new **`project`** content type, stored as `content/projects/*.mdx`,
  with: title, description (MDX body), cover image, **one** location (venue
  reference), **one or more** organisers (organiser references), an automatic
  date stamped on save (sort key), and a publish status.
- Add a public **overview** at `/projecten` — a newest-first grid, blog-style,
  with **no** user-facing sort/filter control.
- Add a public **detail page** at `/projecten/[slug]` — cover, title, MDX
  description, a "Locatie" block (the single venue), and the organisers listed
  (each linking to its organiser page).
- Add a **"Projecten" entry** to the main navigation and footer navigation.
- Add a **homepage section** below the upcoming-events section featuring the
  newest **6** projects, with a "Meer projecten →" link to the overview —
  mirroring the existing upcoming-events pattern.
- Add **admin-only** management in `/beheer`: create, edit, and permanently
  delete projects. The project form offers a single-select location picker and a
  **multi-select** organisers picker. **No** public submission form and **no**
  approval queue — projects are editorial.

## Capabilities

### New Capabilities

- `projects`: The project content type end to end — domain model and reference
  resolution (venue + organisers), the public newest-first overview, the detail
  page, the homepage featured section, and presence in the site navigation.

### Modified Capabilities

- `content-storage`: The content store recognises `project` as an additional
  validated content type, with frontmatter validation and reference resolution
  for its venue and organisers.
- `editorial-backend`: The editorial backend can create, edit, and delete
  projects; the project form exposes a single-location selector and a
  multi-organiser selector. Projects are admin-only (no public submission, no
  review queue).

## Impact

- **Content model**: `src/content/schema.ts` (ContentType enum +
  `ProjectFrontmatter`), `src/content/types.ts` (`Project` interface),
  `src/content/storage.ts` (`CONTENT_PREFIX.project = "projects"`),
  `src/content/repository.ts` (`loadProjects` + `getProjects`/`getProject`,
  resolving the venue and the organisers array — reusing the blog
  `relatedOrganisers` resolver pattern).
- **Routing/nav**: `src/lib/routes.ts` (`/projecten`, `project(slug)`, admin
  segment + public-list path), `src/lib/site.ts` (main + footer nav).
- **Public UI**: new `src/app/projecten/page.tsx` and
  `src/app/projecten/[slug]/page.tsx`; a new `FeaturedProjects` component and its
  placement on `src/app/page.tsx`.
- **Admin UI**: new `src/app/beheer/nieuw/project/page.tsx`, project handling in
  the `/beheer/[type]` edit route and admin server actions, plus a
  multi-organiser selector control.
- **Content storage**: new `content/projects/` directory.
- No breaking changes; existing content types are untouched.
