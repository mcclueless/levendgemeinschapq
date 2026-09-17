## Why

A permalink is fixed forever at the moment an item is first saved, so a hasty
title becomes a permanent public URL. Two are live on goeddoen.net now:
`/projecten/asdfasdf`, a project saved with a throwaway title, and
`/locaties/thee-resia-samentuin-2`, a Location that was later renamed but still
carries its old name and the `-2` it was given because the slug was taken when it
was created. Renaming the title does not help: an edit deliberately keeps the
slug stable. The only fix today is asking a developer, and the editor has asked
for a way to do it themselves.

Investigating that surfaced a gap that already exists. The guard that stops a
Location or Organiser being hidden or deleted while something still uses it looks
only at Events and Blog posts. A Location or Organiser used by a Project, a
Location chosen as an Organiser's location, or either one set as a calendar feed's
default can be deleted today, and the site silently drops the dangling link. A
permalink change has to find exactly the same set of referrers, so the two belong
together.

## What Changes

- Administrators can change the permalink of a **Location**, an **Organiser**, or
  a **Project** from its edit page, as an explicit action separate from saving the
  item's content.
- The requested permalink is normalised the same way generated slugs are. It is
  refused, with a message, when it is empty, unchanged, or already used by another
  item of that type — including a hidden one. A taken permalink is never silently
  suffixed with `-2`.
- Everything that points at a renamed Location or Organiser is updated to the new
  permalink, whatever its publication status: Events, Projects, Blog posts,
  Organisers (their location), and calendar feed defaults.
- The old URL stops existing and returns not found. **No redirects** are kept;
  this was decided explicitly, as the pages concerned are new and little linked.
- The hide and delete guards count every referrer listed above, not only Events
  and Blog posts, so a Location or Organiser used by a Project can no longer be
  deleted out from under it.

Not in scope: permalink changes for Events and Blog posts; redirects from old
URLs; permalink changes by anyone other than an Administrator; replacing the
placeholder text on the affected pages, which is an ordinary content edit.

## Capabilities

### New Capabilities

_None._ Permalink changes are a backend editing action and live in
`editorial-backend`.

### Modified Capabilities

- `editorial-backend`:
  - **Create and edit all content types** — an edit still keeps the slug stable;
    the requirement now points to the explicit permalink change as the single
    exception.
  - **Change the permalink of a Location, Organiser, or Project** — new
    requirement covering who may do it, validation, updating referrers, and the
    old URL no longer resolving.
  - **Referential-integrity guard on hide** and **on delete** — the set of
    referrers grows from Events and Blog posts to also include Projects,
    Organisers' locations, and (for delete) calendar feed defaults.

## Impact

- `src/content/admin.ts` — `findReferences` covers Projects, Organiser locations,
  and feed defaults; hide and delete pick this up unchanged.
- `src/content/write.ts` — a rename operation over the content store, ordered so a
  failure part-way never leaves a dangling reference and can simply be retried.
- `src/content/feeds.ts` — rewriting a feed's default Location or Organiser.
- `src/app/beheer/actions.ts` — an Administrator-only permalink action.
- `src/app/beheer/[type]/[slug]/bewerken/page.tsx` — the permalink field for the
  three types, with its error messages.
- Public pages for the old and new URL, plus the listings, are revalidated after a
  rename.
- Operational: after release, the two URLs above can be fixed from the backend.
  Existing shared links to them will return not found.
