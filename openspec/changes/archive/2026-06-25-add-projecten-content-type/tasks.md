## 1. Content model & schema

- [x] 1.1 Add `"project"` to the `ContentType` enum in `src/content/schema.ts`
- [x] 1.2 Add `ProjectFrontmatter` (title, featuredImage?, venue: string required, organisers: string[] min 1, date: coerce.date, excerpt?, status default published) and register it in `frontmatterByType`
- [x] 1.3 Add `CONTENT_PREFIX.project = "projects"` in `src/content/storage.ts`
- [x] 1.4 Add a `Project` resolved-domain interface to `src/content/types.ts` (venue: Venue | null, organisers: Organiser[], date, status, body, href)

## 2. Repository

- [x] 2.1 Add `loadProjects()` in `src/content/repository.ts`, resolving the single venue and mapping `organisers` through the existing `resolve(slugs, map)` helper (blog pattern)
- [x] 2.2 Add `getProjects()` (published-only, newest-first by `date`) and `getProject(slug)` getters

## 3. Routing & navigation

- [x] 3.1 Add `projects: "/projecten"` and `project(slug)` to `routes.ts`; add `projecten → project` to `ADMIN_SEGMENT_TO_TYPE`/`ADMIN_TYPE_TO_SEGMENT`; add `project → routes.projects` to `PUBLIC_LIST_PATH`
- [x] 3.2 Add a "Projecten" entry to `mainNav` and the "Ontdekken" `footerNav` column in `src/lib/site.ts`

## 4. Public pages

- [x] 4.1 Create `src/app/projecten/page.tsx` — newest-first grid mirroring the blog overview (Container + Badge + heading + CoverImage/Card grid + empty state), `force-dynamic`, no filter control
- [x] 4.2 Create `src/app/projecten/[slug]/page.tsx` — detail page (cover, title, MDX body, Locatie block linking the venue, organisers list linking each organiser), `notFound()` for unpublished/missing
- [x] 4.3 Add page `metadata` for both routes

## 5. Homepage featured section

- [x] 5.1 Create a `FeaturedProjects` server component mirroring `UpcomingEvents` (self-resolving, `limit = 6`, SectionHeading + "Meer projecten →" to `/projecten`, empty state)
- [x] 5.2 Render `<FeaturedProjects>` directly below `<UpcomingEvents>` in `src/app/page.tsx`

## 6. Admin backend

- [x] 6.1 Build a multi-organiser selector control (checkbox group posting repeated `organisers` values) in `src/components/admin/`
- [x] 6.2 Create `src/app/beheer/nieuw/project/page.tsx` (requireAdmin; title, ImageField, single venue `<Select>`, multi-organiser control, excerpt, body, publish) wired to a `createProject` action
- [x] 6.3 Add `createProject`/`updateProject` server actions: stamp `date` automatically on create, preserve it on edit, read `formData.getAll("organisers")`, validate ≥1 organiser
- [x] 6.4 Thread `project` through the `/beheer/[type]` edit + delete routes and any `ContentType`-exhaustive switches (admin list, prefill, delete)
- [x] 6.5 Add a "Nieuw project" entry wherever the admin lists create links for other types

## 7. Cross-cutting

- [x] 7.1 Check `seo-discoverability` output (sitemap + structured data) for a content-type enumeration that must include `project`; add if present
- [x] 7.2 Add a `content/projects/` directory with one sample project `.mdx` for local verification
- [x] 7.3 Run `pnpm typecheck` and `pnpm lint`; resolve any exhaustiveness/type errors the new type surfaces

## 8. Verification

- [x] 8.1 Verify overview lists newest-first with no filter, detail page renders venue + multiple organisers, and unknown references are omitted gracefully
- [x] 8.2 Verify the homepage shows up to 6 newest projects below events with a working "Meer projecten" link
- [x] 8.3 Verify admin create/edit/delete works, organiser multi-select round-trips, and a project cannot be saved with zero organisers
