## Context

A content item's slug is its identity in three places at once:

```
 storage key     venues/<slug>.mdx          (S3 in production, content/ locally)
 public URL      /locaties/<slug>           (plus canonical, og:url, sitemap)
 reference       the string other documents store to point at it
```

`createDocument` derives the slug from the title once, suffixing `-2`, `-3`… on
collision. `updateDocument` never changes it, which the `editorial-backend` spec
requires. The store is a flat key-value interface (`list`, `read`, `readPrefix`,
`write`, `remove`): no rename, no transactions.

Inbound references, found by reading every schema and the feed config:

```
 Venue slug      ◀── Event.venue
                 ◀── Project.venue
                 ◀── Organiser.location
                 ◀── Blog.relatedVenues[]
                 ◀── Feed.defaultVenue           (config under feeds/, not content)

 Organiser slug  ◀── Event.organiser
                 ◀── Project.organisers[]
                 ◀── Blog.relatedOrganisers[]
                 ◀── Feed.defaultOrganiser

 Project slug    ◀── nothing
```

`findReferences` in `src/content/admin.ts` knows only the Event and Blog rows. The
hide and delete guards use it, so a Venue or Organiser used only by a Project, an
Organiser's location, or a feed can be deleted today. The repository then drops the
unresolved reference without a trace (projects spec, "Unknown references degrade
gracefully").

The derived `.index.json` is written only by the `reindex` CLI and read by nothing
at runtime, so a rename need not touch it.

Decisions already taken with the site owner: no redirects (old URLs may 404);
Administrators only; Locations, Organisers, and Projects only.

## Goals / Non-Goals

**Goals:**
- An Administrator fixes a bad permalink from the backend, without a developer.
- A rename never leaves a reference pointing at nothing, including after a failure
  part-way.
- Rename, hide, and delete agree on what counts as a reference, because they share
  one definition of it.

**Non-Goals:**
- Redirects from old URLs.
- Permalink changes for Events and Blog posts.
- Rewriting hard-coded links inside MDX bodies (see Risks).
- Changing how new slugs are generated at creation time.

## Decisions

### D1. One reference table, used for finding and for rewriting

Describe the rows above once, as data: for each referring kind, the prefix to read,
the fields holding Venue slugs, and the fields holding Organiser slugs, noting which
are arrays. Two functions are built on it:

- `findReferences(type, slug, { includeHidden })`, extended to Projects, Organiser
  locations, and — only when `includeHidden` is set, i.e. for delete — feeds.
- a pure `rewriteReferences(frontmatter, kind, type, from, to)` that returns the
  patched frontmatter, or `null` when nothing in it points at `from`.

*Why:* the current gap exists because the guard and the schemas were maintained
separately. If rename had its own list, it could drift the same way, and a rename
missing a field produces exactly the silent orphan this change sets out to prevent.
The pure rewrite function is unit-testable without a store, in the style of
`mergeDocument` in `write.test.ts`.

*Alternative:* scanning every string field for the old slug. Rejected, because a
title or excerpt that happens to contain the slug text would be rewritten.

`ContentReference.kind` widens to `event | blog | project | organiser | feed`. A
feed's `href` is its backend edit page, since it has no public page. The list
page's blocked messages already render `title` and `href` per reference, so they
need no structural change.

### D2. Feed defaults count for delete, not for hide

The hide guard exists to protect live public links. A feed is configuration and has
no public page, so a hidden Venue that is a feed default breaks nothing visible;
counting it would block hiding for no visitor-facing reason. Delete is
irreversible, and the next sync would create events pointing at a Venue that no
longer exists, so a feed default blocks it. This matches the existing split where
hide counts published referrers and delete counts all of them.

### D3. Copy, rewrite, then delete — in that order

```
 1. write   <prefix>/<new>.mdx  ← exact copy of <prefix>/<old>.mdx
 2. for each referrer (all statuses, and feeds): patch old → new
 3. remove  <prefix>/<old>.mdx
 4. revalidate old and new item paths, the listings, and each referrer's page
 5. redirect to the new edit URL
```

The invariant is **every reference resolves at every step**. After step 1 both
slugs exist. During step 2, rewritten referrers point at `new`; the rest still
point at `old`, which still exists. Only once nothing points at `old` is it
removed.

*Alternative:* delete first, or rewrite before copying. Either one opens a window
where a failure leaves references that resolve to nothing, and on the public site
that looks like a missing link rather than an error.

*Trade-off:* between steps 1 and 3 the item briefly appears twice in public
listings. This lasts the length of one server action, and publicly it is harmless.

### D4. Retry is recognised, not rejected as "taken"

After a failure between steps 1 and 3, `<new>` exists, so a naive retry would
report the permalink as taken. The action therefore treats the request as a resume
when **both** `<old>` and `<new>` exist **and** their stored contents are
identical, and continues from step 2. Rewriting is idempotent: a referrer already
pointing at `new` returns `null` from `rewriteReferences` and is not written. If
`<new>` exists with different content, it belongs to another item and the request
is refused as taken.

### D5. Validation

Apply `slugify` to the input, so the rules match generated slugs. Refuse when the
result is:
- empty,
- equal to the current slug,
- or `<prefix>/<result>.mdx` exists (subject to D4).

The existence check uses the store directly, so hidden and draft items reserve
their slugs as the spec requires. There is no `uniqueSlug` fallback: a suffix the
Administrator did not type is how `-2` arrived in the first place.

Refusals redirect back to the edit page with `?permalink=empty|unchanged|taken`,
following the existing `?error=1` / `?blocked=` pattern. The page renders a
specific Dutch message for each.

### D6. A separate form on the edit page

The three edit pages get a small second form below the content form. It holds the
current slug in an input, previews the resulting public URL, notes that the old URL
will stop working, and has its own submit button. It posts to a new
`changePermalink` action, gated by `assertAdmin()` like every other backend action.
The action accepts only `venue`, `organiser`, and `project`.

*Why separate:* a rename rewrites other documents and deletes a file. Folding it
into the everyday save would put that risk on every text correction, and a refused
permalink would have to reject, or half-apply, the content edit made alongside it.

### D7. Revalidation

Most public detail pages are `force-dynamic` now, but listings, the homepage, and
the CDN still cache. The action calls `revalidateAfterItemChange` for both the old
and the new slug. It also revalidates the detail path of every referrer rewritten
in step 2, reusing `itemPath`, so an event page does not keep linking to the old
Venue URL.

## Risks / Trade-offs

- **[Hard-coded links in MDX bodies]** A blog post or description that links to
  `/locaties/<old>` by hand is not rewritten and will 404. → The confirmation text
  says old links stop working. Scanning bodies is left out on purpose, since
  rewriting free text is the kind of change an editor should see. It can be added
  later as a report.
- **[Concurrent edit during a rename]** Another save to a referrer between its read
  and its patch could be lost. → There is a single Administrator, and a rename
  takes seconds. `patchFrontmatter` re-reads just before writing, which narrows the
  window. Accepted.
- **[Shared links and search engines]** Old URLs return not found. → Accepted by
  the site owner; the affected pages are new and little linked.
- **[S3 partial failure]** A write can fail mid-sequence. → D3 keeps every
  reference resolvable, and D4 makes the same request finish the job.
- **[Guard now blocks actions it used to allow]** Hiding or deleting a Venue used by
  a Project, an Organiser, or (for delete) a feed is refused where it used to
  succeed. → That is the intended fix. The refusal names each referrer with a link,
  as today.

## Migration Plan

No data migration: stored documents do not change shape. Deploy, then fix the two
known URLs from the backend: `/projecten/asdfasdf`, and
`/locaties/thee-resia-samentuin-2`. The clean `thee-resia-samentuin` slug may still
be reserved by a hidden Venue (the public URL 404s). If so, the backend will say
it is taken, and the Administrator decides whether to delete that item first.

Rollback is a revert. Renames already made are ordinary data changes and remain
valid under the previous code.

## Open Questions

None blocking.
