## Why

Permanent deletion ("Verwijderen") only exists for Events. An editor who wanted to remove a Venue ('t Anker) reassigned its events away and then looked for a delete button — but there is none for Venues, Organisers, or Blog posts; those can only be *hidden* (`Verbergen` → draft), never permanently removed. The missing button (rather than a blocked one) left the editor confused about whether the interface was even capable of it. This change makes every content type permanently deletable, guarded so a Venue/Organiser that anything still points to cannot be orphaned.

## What Changes

- Add permanent **Verwijderen** to **Venues, Organisers, and Blog posts** (Events already have it), on both the admin list and the public admin banner.
- **Guard deletion of a Venue/Organiser** against *any* reference of *any* status — a published, past, or hidden/draft Event or Blog post that still points to it blocks deletion, and the referencing items are named so the editor can reassign/unlink them first. Events and Blog posts have no inbound references, so their deletion is always allowed.
- This delete guard is **stricter than the hide guard** (which stays published-only): hiding a Venue is blocked only by *published* referrers, but permanently deleting it is blocked by *any* referrer, since deletion is irreversible and a later-published draft would otherwise dangle.
- The **Verwijderen button is always visible** for every type; the guard runs at click-time and, when it blocks, shows a named list of the referencing items (mirroring the existing hide-block pattern). Deletion keeps the strong, explicit confirmation.

## Capabilities

### Modified Capabilities
- `editorial-backend`: Generalize "Permanently delete events" to permanent deletion of **any** content type, and add a referential-integrity guard on delete that blocks a referenced Venue/Organiser using an **all-status** reference scan (distinct from the published-only hide guard), reporting the referrers.
- `admin-presence`: Generalize the banner's "delete an event from its page" to deleting **any** content type from its public page, applying the same all-status delete guard (success → public listing; blocked → backend list naming the referrers).

## Impact

- **Actions** (`src/app/beheer/actions.ts`): generalize `performDeleteEvent(slug)` → `performDelete(type, slug)` (guard for venue/organiser, none for event/blog); add a generalized delete action (managedType + slug) for the admin list; generalize `deleteFromPublic` to all types with the guard.
- **Reference scan** (`src/content/admin.ts`): parameterize `findReferences(type, slug, { includeHidden })` — hide passes published-only (unchanged), delete passes all-statuses. One function, two strictness levels; still returns empty for event/blog targets.
- **Admin list** (`src/app/beheer/[type]/page.tsx`): render Verwijderen for every type; introduce a distinct delete-block signal (e.g. `?undeletable=<slug>`) so the page names the all-status reference set, separate from the hide-block `?blocked=<slug>` (published set).
- **Public banner** (`src/components/admin/admin-bar-mount.tsx`): show Verwijderen for all types (drop the events-only condition).
- **No schema or data changes.** `deleteDocument` is already generic; a dangling reference still degrades gracefully (missing slug resolves to `null`, the line is omitted).
- **Out of scope**: changing the hide guard's published-only semantics; cascade-delete of referencing items (the editor reassigns/unlinks first); multi-user concerns.
