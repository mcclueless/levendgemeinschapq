## Context

The codebase already has a uniform "content-type spine": each type (`event`,
`venue`, `organiser`, `blog`) appears in `schema.ts` (zod frontmatter),
`types.ts` (resolved domain model), `storage.ts` (`CONTENT_PREFIX`),
`repository.ts` (cached loaders + published-only getters), `routes.ts`
(public + admin paths), `site.ts` (nav), a public overview + detail page, and
the `/beheer` admin CRUD. Adding `project` means walking that spine once more.

Two existing precedents do most of the heavy lifting:

- **Blog** resolves an *array* of organiser references (`relatedOrganisers`) via
  a small `resolve(slugs, map)` helper — the exact shape Projecten needs for its
  many-organisers field.
- **UpcomingEvents** is a self-resolving, embeddable listing section with a
  title, a limit, and a "see more" link — the exact shape the homepage Projecten
  section needs.

So the change is mostly *replication with two deviations*: many organisers, and
an automatic sort date. Listing/detail/home pages already render per request
(`export const dynamic = "force-dynamic"`), so no caching strategy is introduced.

## Goals / Non-Goals

**Goals:**

- A first-class `project` content type with one location and many organisers.
- Newest-first ordering everywhere, with no user-facing filter control.
- Admin-only authoring; reuse existing form/list/delete infrastructure.
- Maximal reuse of existing components and patterns (CoverImage, Card,
  AdminShell, the blog overview layout, the UpcomingEvents section shape).

**Non-Goals:**

- No public "submit a project" form and no approval/review queue.
- No sort/filter UI, no pagination, no tags/categories.
- No project↔event linking, no gallery beyond the single cover image.
- No changes to existing content types' behaviour.

## Decisions

### D1 — Many organisers, one venue

`ProjectFrontmatter` uses `venue: z.string().min(1)` (single, required, like
Event) and `organisers: z.array(z.string()).min(1)` (one or more, required).
The resolved `Project` model carries `venue: Venue | null` and
`organisers: Organiser[]`. Resolution reuses the blog `resolve(slugs, map)`
helper in `repository.ts`: organisers map through it; an unknown slug is dropped
rather than rendered broken.

*Alternative considered:* a single `organiser` plus optional `coOrganisers`.
Rejected — an array is simpler, symmetric, and avoids a "primary organiser"
concept the brief never asked for.

### D2 — Automatic sort date, not an editor field

Sorting needs a date, but the brief's field list deliberately has none. We stamp
`date: z.coerce.date()` into frontmatter **at create time** in the admin write
path, defaulting to the moment of saving. It is **not** a field on the create
form, so editors enter only title/description/cover/location/organisers. The
public getter sorts `b.date - a.date` (newest first), identical to the blog
getter. Editing a project preserves its original `date` (the edit path patches
other fields and leaves `date` intact).

*Alternative considered:* sort alphabetically by title (no date at all).
Rejected — the homepage "feature the newest 6" framing needs recency; an
alphabetical home section would surface the same projects forever.

*Alternative considered:* an editor-visible date field. Rejected for now to keep
the form minimal; the schema field exists, so exposing it later is additive.

### D3 — No filter; fixed newest-first order

The overview renders a single newest-first grid with no query params and no
toggle, matching the blog overview exactly. This avoids introducing the first
interactive client-side filter control in the codebase. If a sort toggle is ever
wanted, it can be added later as a query-param (`?volgorde=`) server re-sort
without reworking anything here.

### D4 — Admin-only, status reused, no submission pipeline

`ProjectFrontmatter` keeps `status: PublishStatus.default("published")` so the
public repository's `isPublished` filter, plus admin hide/show/delete, work
unchanged. It omits `submittedBy`/`submittedAt`/`reviewNote` — there is no public
submission and nothing enters the approval queue. The `/beheer/nieuw/project`
page and the existing `/beheer/[type]` edit/delete routes handle authoring,
gated by `requireAdmin()` like every other admin page.

### D5 — Multi-organiser admin control

The event form picks one organiser with a `<Select>`. The project form needs
many. **Implementation note:** rather than building a new checkbox-group
control, the project form reuses the codebase's existing many-relationship
pattern — a native `<Select multiple className="min-h-32">` with the "Houd
Ctrl/⌘ ingedrukt voor meerdere" hint, exactly as the blog form does for its
`relatedOrganisers`/`relatedVenues`. Reusing the established pattern keeps the
admin forms visually consistent and avoids a bespoke component. The server
action reads `formData.getAll("organisers")` and rejects an empty selection
(≥1 required). The single venue keeps the existing single-`<Select>` pattern
verbatim.

### D6 — Routing and naming

Dutch public route `/projecten` with detail `/projecten/[slug]`; `routes.project`
+ `routes.projects` added. Admin segment `projecten → project` added to
`ADMIN_SEGMENT_TO_TYPE`/`ADMIN_TYPE_TO_SEGMENT`, and the `project → routes.projects`
entry added to `PUBLIC_LIST_PATH` (the total-record typing makes this a
compile-time requirement). `CONTENT_PREFIX.project = "projects"` →
`content/projects/*.mdx`.

### D7 — Reuse for public pages

The overview clones the blog page layout (Container + Badge + heading + a
`CoverImage`/`Card` grid). `FeaturedProjects` mirrors `UpcomingEvents`: a
self-resolving server section taking `title`, `limit = 6`, and a `moreHref`,
rendered on the homepage directly below `UpcomingEvents`. The detail page mirrors
an event/blog detail page, adding a "Door" block that maps over `organisers`
with links to each organiser page.

## Risks / Trade-offs

- **Sitemap/SEO coverage** → If a sitemap enumerates content types explicitly,
  projects must be added there too; include a tasks item to check
  `seo-discoverability` output (sitemap/structured data) for an enumeration that
  needs the new type.
- **Admin queue/list assumptions** → Admin list views and referential-integrity
  guards may enumerate content types; `project` must be threaded through the
  `[type]` registry and any `ContentType`-exhaustive switches. Mitigation: the
  `PUBLIC_LIST_PATH` total record and zod `frontmatterByType` map will surface
  most omissions as type errors; run `pnpm typecheck`.
- **Referential integrity** → Projects reference venues/organisers; deleting a
  referenced venue/organiser could orphan a project's reference. The resolver
  already drops unknown slugs (renders without the block), so this degrades
  gracefully; extending the delete-guard to count project references is optional
  and can be a follow-up.
- **No-organiser data** → `organisers` is required (`.min(1)`); the form must
  validate at least one is chosen so a project can't be saved organiser-less.
