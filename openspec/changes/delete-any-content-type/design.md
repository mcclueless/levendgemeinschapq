## Context

Permanent deletion is Events-only today. `deleteEvent`/`performDeleteEvent(slug)` (`src/app/beheer/actions.ts`) call the generic `deleteDocument(type, slug)` (`src/content/write.ts`), but the admin list (`src/app/beheer/[type]/page.tsx`) renders "Verwijderen" only when `type === "event"`, and the public admin banner (`admin-bar-mount.tsx` + `deleteFromPublic`) is likewise events-only. Hiding (`Verbergen`) exists for all non-event types, guarded by `findReferences(type, slug)` (`src/content/admin.ts`) — which counts **published** Events/Blog posts referencing a Venue/Organiser and returns empty for event/blog targets. A dangling reference degrades gracefully: `loadEvents`/`loadPosts` resolve a missing slug to `null` and the page omits that line.

An editor reassigned all of a Venue's events and then looked for a delete button that did not exist. The fix: make every type deletable, guarded so a referenced Venue/Organiser cannot be orphaned.

## Goals / Non-Goals

**Goals:**
- Permanent delete for Venues, Organisers, and Blog posts (Events already have it), on the admin list and the public banner.
- Block deleting a referenced Venue/Organiser, naming the referrers — stricter than hide (any status, not just published).
- Always show the delete button; explain at click-time when blocked (fixes the "missing button" confusion).

**Non-Goals:**
- Changing the hide guard's published-only semantics.
- Cascade-deleting referencing Events/Blog posts (the editor reassigns/unlinks first).
- Multi-user / roles.

## Decisions

### D1 — Generalize the delete action, not duplicate it
`deleteDocument` is already generic. Rename/extend `performDeleteEvent(slug)` → `performDelete(type, slug)`: run the delete guard for `venue`/`organiser`, skip it for `event`/`blog` (no inbound refs). The admin list posts to one generalized delete action (`managedType` + `slug`); `deleteFromPublic` drops its `type !== "event"` reject and calls `performDelete`.

### D2 — One reference scan, two strictness levels
Parameterize `findReferences(type, slug, { includeHidden })` rather than add a second scanner. Hide calls it published-only (current behavior, unchanged); delete calls it with `includeHidden: true` so any-status referrers count. Keeps the rule in one place and makes the hide-vs-delete difference explicit at the call site.
- *Why stricter for delete:* hide is reversible and only protects live public links, so a draft referrer is irrelevant. Delete is irreversible; a hidden/draft Event re-published later would dangle. Blocking on any-status referrers prevents that.

### D3 — Always-visible button, guard at click-time, named block
The editor was confused by an *absent* button. Render "Verwijderen" for every type unconditionally (like "Verbergen"); the guard decides at submit time. When blocked, redirect with the referrers named — reusing the established hide-block UX. This both fixes the confusion and teaches the rule (they'd see "blocked: 3 events" before reassigning, success after). Keep the strong irreversible-action confirmation via `ConfirmButton`.

### D4 — Distinct block signal for delete vs hide
Hide-block already uses `?blocked=<slug>` on the admin list and re-derives the **published** referrers to name them. Delete-block reports the **all-status** set, a different (larger) list, so it needs a distinct signal — `?undeletable=<slug>` — and the list page re-runs the scan with `includeHidden` for that case. Sharing one param would conflate the two reference sets and mislabel which referrers are blocking.

## Risks / Trade-offs

- **Confusing block by a hidden referrer** → An editor may be blocked from deleting a Venue by an Event they can't see on the public site. Mitigation: the block message names and links the referrer (including hidden ones), and the admin list shows hidden items with a "Verborgen" badge, so it's findable.
- **Two guard scopes drift** → Hide and delete now use the same function with different flags; a future change to `findReferences` must keep both honest. Mitigation: one function, the flag is explicit at each call site, and a scenario pins the "hidden referrer blocks delete but not hide" distinction.
- **Required-field "disassociation"** → `venue`/`organiser` are required on Events, so an editor cannot blank them — they must reassign to another Venue/Organiser. Blog relations are optional arrays and can be emptied. The block message should make "reassign or unlink these" actionable (links to the referrers).
- **Accidental permanent loss** → Delete is irreversible. Mitigation: explicit confirm dialog retained; the reference guard prevents the most damaging case (deleting a still-used entity).

## Migration Plan

No data or schema changes; purely additive behavior.
1. Parameterize `findReferences` with `includeHidden` (default false = current behavior).
2. `performDelete(type, slug)` with the all-status guard for venue/organiser.
3. Generalized admin-list delete action + render Verwijderen for all types; add `?undeletable=` handling.
4. Generalize `deleteFromPublic` + show Verwijderen for all types in the banner.

Rollback: restore the events-only delete action and the `type === "event"` conditions; the `includeHidden` flag defaults to the prior behavior.

## Open Questions

- None blocking. Exact wording of the Dutch block message is an implementation detail constrained by the spec ("name the referencing items").
