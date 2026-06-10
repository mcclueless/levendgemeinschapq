## Context

The backend was shipped create-only; editing and removal of existing items were deferred in `community-event-calendar` task 8.2. The storage and rendering layers already provide everything this needs:

- **`ContentStore`** (`storage.ts`) implements `read`, `write`, `readPrefix`, and `remove` on both the local-FS and S3 backends.
- **`write.ts`** has `patchFrontmatter` (merges `{...data, ...patch}` and re-serializes) and `setStatus` (used today by approve/reject).
- **`repository.ts`** loads *all* statuses into per-type maps, but every **public** getter filters `status === "published"`. So a `draft` is invisible publicly the moment ISR revalidates.
- **`schema.ts`** gives all four types a `PublishStatus` of `draft | pending | published`.

The gap is therefore UI + action wiring + a safe update path — not new infrastructure.

## Goals / Non-Goals

**Goals:** list existing content per type; edit in place with stable slugs; hide/show via status; block unsafe hides with a clear reason; gate mutations on admin.

**Non-Goals:** hard file deletion; slug renaming/redirects; limited-user ownership scoping.

## Decisions

### D1 — "Delete" is unpublish, not file removal
Setting `status: "draft"` hides an item from every public getter while preserving the document (and its index entry, media, and history). A "show" action sets it back to `published`. Reuses the existing `setStatus`; `ContentStore.remove()` is intentionally left unused.

**Why:** The reporter wants items to stop appearing publicly, not to destroy data. Hiding is reversible and avoids dangling media/index references that hard deletion would create.

### D2 — Edit merges frontmatter and keeps the slug stable
A new `updateDocument(type, slug, frontmatterPatch, body)` reads the existing document, applies `{...existing, ...patch}` to frontmatter (same merge semantics as `patchFrontmatter`), replaces the body, and writes back to the **same key**. The slug is never recomputed from the (possibly edited) title.

**Why:** The create actions build frontmatter from scratch; reusing that path for edits would silently drop fields no form exposes — event `uid` (calendar dedup), venue `images`, blog `relatedVenues/relatedOrganisers`, and `submittedBy/submittedAt`. Merging preserves them. A stable slug keeps public URLs and the derived index entry intact (no redirects, no orphaned index rows).

**Alternative rejected:** Re-slug on title change + emit redirects — adds redirect infrastructure for a backend convenience, and risks breaking inbound links and SEO. Not worth it.

### D3 — Referential-integrity guard on hide (Venues / Organisers only)
Before hiding a Venue or Organiser, scan for **published** items that reference it:

```
hide VENUE      → blocked if any published event has  event.venue == slug
                  or any published blog lists slug in  relatedVenues
hide ORGANISER  → blocked if any published event has  event.organiser == slug
                  or any published blog lists slug in  relatedOrganisers
hide EVENT/BLOG → always allowed (nothing references them)
```

When blocked, the backend returns the list of referencing items (title + link) so the admin can hide/reassign those first. A new `findReferences(type, slug)` in `admin.ts` performs the scan.

**Why:** `repository.ts` resolves an event's venue/organiser from a map that includes drafts, so a hidden venue would still render as a link on a still-published event's page — pointing at a now-404 venue page. Blocking the hide prevents the dangling link. The check is scoped to *published* referrers because draft referrers are themselves invisible.

### D4 — Admin gating
`updateEvent/Venue/Organiser/Blog`, `hide*`, and `show*` actions call the existing `assertAdmin()` guard (redirect to `/beheer/login` if not admin), matching `approveSubmission` / `rejectSubmission`. The list and edit routes are server components under the already-`force-dynamic`, auth-required `/beheer` tree.

**Why:** `user-roles-approval` reserves edit/delete for Administrators. Under the interim single-admin auth this is simply `assertAdmin`; when limited-user roles land, ownership scoping layers on top without reworking these actions.

### D6 — Permanent deletion, Events only
Events (and only Events) support irreversible deletion via a new `deleteDocument(type, slug)` that calls the existing `ContentStore.remove(key)`. Venues/Organisations/Blog posts remain unpublish-only.

**Reference guard:** Nothing references Events (Blogs and Events both point *at* venues/organisers, not the other way round), so deleting or hiding an Event needs no guard. (An earlier iteration guarded against organiser portfolio `eventRef` links, but the portfolio feature was since removed entirely.)

**Runtime safety:** `repository.ts` reads the store directly (`readPrefix`); the derived index (`index-build.ts`) is a build/CLI artifact, not queried at runtime, so a delete needs only file removal + revalidation — no index mutation.

**Accepted limitations:** a deleted Event's uploaded featured image is left in the media store (media may be shared; pruning is riskier than the delete — out of scope). A deleted recurring Event's calendar `uid` is gone, so a later re-import of the same feed could recreate it; that is expected import behavior.

**Confirmation:** deletion is destructive and irreversible, so the delete control requires an explicit confirm before posting.

### D5 — Revalidation
Every mutation calls the existing `revalidatePublic()` plus `revalidatePath("/beheer/[type]")`. Consistent with create/approve; on-demand revalidation is a best-effort speed-up over the load-bearing 600s ISR window (per `community-event-calendar` D4).

## Risks / Trade-offs

- **Edit merge correctness** is the main risk — a regression that overwrites instead of merging would silently lose `uid`/`images`/relations. Mitigation: `updateDocument` is the single write path for edits and is unit-tested against fixtures that carry those fields.
- **Reference scan cost** is an O(events + blogs) read per hide. Negligible at this content scale (read-light backend, write-rare). No index change needed.
- **Stale public link window:** after a hide, the public page can serve the cached version for up to the ISR window. Acceptable and unchanged from current publish behavior.

## Migration

None. No schema, storage-layout, or content changes; existing documents already carry `status`.
