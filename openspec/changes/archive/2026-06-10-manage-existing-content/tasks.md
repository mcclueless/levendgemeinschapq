## 1. Content access layer

- [x] 1.1 Add `listContent(type)` to `src/content/admin.ts` returning all items of a type (any status) with `slug`, title/name, `status`, and a date/sort key — for the backend listing views
- [x] 1.2 Add `findReferences(type, slug)` to `src/content/admin.ts` that returns published Events/Blogs referencing a given Venue or Organiser slug (event `venue`/`organiser`, blog `relatedVenues`/`relatedOrganisers`); returns empty for event/blog targets

## 2. Write path

- [x] 2.1 Add `updateDocument(type, slug, frontmatterPatch, body)` to `src/content/write.ts` that reads the existing doc, merges frontmatter (`{...existing, ...patch}`), replaces the body, and writes back to the **same key** (slug unchanged)
- [x] 2.2 Confirm hide/show reuse the existing `setStatus(type, slug, "draft" | "published")` — no new primitive
- [x] 2.3 Unit-test `updateDocument` against fixtures carrying `uid`, venue `images`, organiser cover image, blog relations, and `submittedBy/At` to prove merge preserves form-absent fields

## 3. Server actions (admin-gated)

- [x] 3.1 Add `updateEvent`, `updateVenue`, `updateOrganiser`, `updateBlog` to `src/app/beheer/actions.ts`, each `assertAdmin()`-gated, reusing the create form field parsing and calling `updateDocument`
- [x] 3.2 Add `hideContent(type, slug)` that calls `findReferences` first and, if non-empty for a Venue/Organiser, aborts and surfaces the referencing items instead of hiding; otherwise sets status `draft`
- [x] 3.3 Add `showContent(type, slug)` that sets status `published`
- [x] 3.4 Wire `revalidatePublic()` + `revalidatePath("/beheer/[type]")` into every mutation

## 4. Backend UI

- [x] 4.1 Add the listing route `src/app/beheer/[type]/page.tsx` (admin-required) listing items with title, status badge, and Edit / Hide-or-Show actions; link the dashboard counts to these lists
- [x] 4.2 Add the edit route `src/app/beheer/[type]/[slug]/bewerken/page.tsx` reusing the create form components, prefilled from the existing document, submitting to the matching `update*` action
- [x] 4.3 Render the blocked-hide outcome: show the list of referencing Events/Blogs (title + link) with guidance to hide/reassign them first
- [x] 4.4 Add confirmation UX for hide/show

## 5. Verification

- [x] 5.1 Edit each content type and confirm form-absent fields survive (spot-check stored MDX for `uid`/`images`/relations)
- [x] 5.2 Confirm a hidden item disappears from its public listing and its detail page 404s; confirm show restores it
- [x] 5.3 Confirm hiding a Venue/Organiser referenced by a published Event/Blog is blocked and lists the referrers; confirm it succeeds once the referrers are hidden
- [x] 5.4 Confirm edit/hide/show all redirect to `/beheer/login` when not authenticated
- [x] 5.5 `pnpm typecheck` and `pnpm lint` pass

## 6. Permanent event deletion (events only)

- [x] 6.1 Add `deleteDocument(type, slug)` to `src/content/write.ts` wrapping `getStore().remove(keyFor(...))`
- [x] 6.2 `findReferences` covers venue/organiser referrers; Events have no referrers, so it returns empty for them (no guard needed on event delete/hide)
- [x] 6.3 Add admin-gated `deleteEvent(formData)` to `src/app/beheer/actions.ts`: `deleteDocument` + `revalidatePublic()` + `revalidatePath`
- [x] 6.4 Add a confirmed "Verwijderen" action to the Events list only (`type === "event"`)
- [x] 6.5 Verify: deleting an event removes the file and 404s its page; delete is admin-gated; `pnpm typecheck`/`lint`/`test` pass

## 7. Cover images (folded in)

- [x] 7.1 Add `featuredImage` to Venue and Organiser (schema, types, repository) — events/blogs already had it
- [x] 7.2 Add cover upload fields to the venue/organiser create + edit forms; create/update actions call `saveUpload` (update overwrites only when a new file is sent)
- [x] 7.3 Render covers: hero on every detail page (event/venue/organiser/blog) and thumbnail on listings, via a shared `CoverImage` component
- [x] 7.4 Events fall back to a branded default placeholder (`/event-placeholder.svg`, `src/lib/images.ts`); other types render a cover only when uploaded
- [x] 7.5 Fix `media.ts`: fall back to the bucket's virtual-hosted S3 URL when `NEXT_PUBLIC_MEDIA_BASE_URL` is unset
- [x] 7.6 Verify cover render across types via HTTP; confirm imageless items stay clean

## 8. Remove organiser portfolio (folded in)

- [x] 8.1 Remove `PortfolioItem` + `portfolio` from schema, types, repository, and the `Portfolio` component (deleted)
- [x] 8.2 Remove the "Wat wij doen" portfolio section from the organiser detail page and the edit-form note
- [x] 8.3 Strip `portfolio` blocks from the organiser seed files
- [x] 8.4 Retire the event reference-guard (only existed for portfolio `eventRef`): `findReferences` back to venue/organiser-only; `deleteEvent` unguarded
- [x] 8.5 Update specs (main `organisers`/`editorial-backend`, this change's deltas); `pnpm typecheck`/`lint`/`test` pass
