## Context

```
  TODAY
  ┌──────────────────────────────────────────────────────────────┐
  │  /beheer/import                                              │
  │    URL          [ https://…/basic.ics ]  ← typed every time  │
  │    Locatie      [ de-brink        ▾ ]    ← chosen every time │
  │    Organisator  [ stichting-anker ▾ ]    ← chosen every time │
  └──────────────────────────┬───────────────────────────────────┘
                             ▼
                  importFromUrl(url, defaults)
                             │
                  for each VEVENT:
                    uid seen? ──yes──▶ SKIP
                         │no
                         ▼
                    create(status: pending)
                             │
                             ▼
              redirect(?created=3&skipped=12)
                             │
                    ┌────────────────┐
                    │ URL discarded  │  ← the whole problem
                    └────────────────┘
```

Three consequences, one reported and two not:

| | Reported? |
|---|---|
| Feed must be re-entered by hand; nothing to list/edit/delete | yes |
| New events in the source never arrive on their own | yes |
| Events **cancelled** at the source stay on the site forever | no |

## Goals / Non-Goals

**Goals:**

- A feed persists, with its defaults, and can be listed, edited and deleted.
- One explicit click brings in whatever is new.
- An event cancelled at the source stops being shown.
- No editorial work is ever destroyed by a sync.

**Non-Goals:**

- Scheduled sync (D2), updating changed events (D3), deleting cancelled events
  (D4), auto-publishing (D8).

## Decisions

### D1 — Feeds are configuration, not content; same store, not a `ContentType`

The tempting move is to add `feed` to `ContentType` and get the whole
content-type spine for free. The type system refuses, and it is right to:

```
  add "feed" to ContentType
        │
        ├─ frontmatterByType                    ✔ natural
        ├─ CONTENT_PREFIX                       ✔ natural
        ├─ ADMIN_SEGMENT_TO_TYPE                ✔ free list page
        │
        ├─ PUBLIC_PATH      (admin.ts:129)      ✘ no public page exists
        ├─ PUBLIC_LIST_PATH (routes.ts:54)      ✘ no public page exists
        └─ itemPath()       (revalidate.ts:50)  ✘ nothing to revalidate
```

`routes.ts:50` says of that Record, verbatim: *"adding a new type to
ADMIN_TYPE_TO_SEGMENT without a path here is a compile error, not a runtime
`undefined` redirect."* It was written to catch precisely this. Satisfying it
would mean inventing three public URLs that do not exist. `listContent` also
assumes every item carries a `PublishStatus`; a feed is not draft/pending/
published, it is simply present.

So: feeds persist **through `getStore()`** under a `feeds/` prefix — inheriting
the S3/local-filesystem split and needing no new persistence layer — but are
**not** a `ContentType`. They get their own small schema, repository and
`/beheer/feeds` page.

Verified safe: every existing reader (`repository.ts`, `index-build.ts`,
`sitemap.ts`, `admin.ts`) enumerates its prefixes explicitly. Nothing globs the
content root, so an unregistered prefix is invisible to all of them.

### D2 — Manual sync. No scheduler, deliberately

The deploy target is Amplify `WEB_COMPUTE` (see `amplify.yml`): request handlers
only, no cron. The repository contains no scheduler of any kind. Genuine
automation would mean new infrastructure — an EventBridge schedule, or a
GitHub Actions cron calling a secret-guarded route handler.

A button needs none of that: a server action already runs behind
`assertAdmin()`, with no endpoint to protect and no shared secret to rotate. It
also avoids the concurrency hazard a lazy on-read sync would introduce, where
two simultaneous visitors could both trigger an import.

The honest trade: this is one click, not zero. The reason it still solves the
reported problem is that **the URL stops disappearing** — which is what makes
the current behaviour feel broken.

Deliberately left easy to upgrade: the sync logic lives in a plain function, so
adding a scheduled caller later means adding a caller, not restructuring.

### D3 — Copy semantics: create new, never touch existing

A synced event whose UID is already present is skipped and left exactly as it
is. Nothing a sync does can overwrite a corrected venue, a rewritten
description, or a chosen cover image.

Rejected alternative — Mirror (feed is source of truth, update everything). It
is *viable here*: the admin confirms they approve imported events roughly as-is,
so there is usually little editorial work to destroy. It was declined anyway
because "usually little" is not "none", and Copy defers the ownership question
rather than answering it irreversibly. Adding update-on-change later is a small,
low-risk follow-up given that same fact.

### D4 — Cancellation-hiding, and the three guards that make it safe

The naive rule — "if a UID we imported is no longer in the feed, hide it" — is
actively dangerous. Three ways it goes wrong, and the guard for each:

**Guard 1: only future-dated events.**
Many calendar feeds (Google's among them) publish a rolling window and drop
past entries. Without this guard the first sync would "cancel" the entire
history of the site in one click.

**Guard 2: only when the fetch succeeded and returned at least one entry.**
An expired or rotated feed URL, an auth change, or a transient network failure
can all yield zero entries. Zero entries technically means "everything was
cancelled" and almost never does. A feed that legitimately empties will simply
not hide anything until it has one entry again — a far better failure than mass
hiding.

**Guard 3: only events carrying this feed's `feedId`.**
Never hand-created events, and never another feed's events, even on a UID
collision.

```
  candidate for hiding  ⟺  feedId == this feed
                       AND  start is in the future
                       AND  uid ∉ current fetch
                       AND  fetch succeeded with ≥ 1 entry
```

**Hide, never delete.** `status: "draft"` reuses the existing hide flow, is
reversible from the backend, and keeps permanent deletion a deliberate admin
action. A wrongly-hidden event is an annoyance; a wrongly-deleted one is gone.

### D5 — Events carry an optional `feedId`

`EventFrontmatter` gains `feedId?: string`. **Optional, not required** — the
same hazard the archived recurrence change recorded as its D2: `parseAll`
*skips* documents that fail validation, so a required field would silently
remove every previously-imported event from both the public site and the
backend list, with only a log line to show for it.

Consequence: events imported before this change have a `uid` but no `feedId`,
so guard 3 excludes them from cancellation-hiding forever. Mitigation — on
sync, **adopt** them: stamp this feed's `feedId` onto existing events whose UID
appears in this feed's fetch. Adoption is a `feedId` write only; it must not
touch any other field, or it becomes an update path through the back door and
violates D3.

### D6 — Defaults move onto the feed

`defaultVenue` and `defaultOrganiser` are chosen per import today. They become
feed fields. This is what turns re-syncing into one click, and it is the natural
home for them — they describe the feed, not the moment.

### D7 — The feed records its last outcome

`lastSyncedAt` plus the last counts (created / skipped / hidden / flagged) and
the last error, stored on the feed. Without this, pressing "Sync nu" redirects
and the admin has no way to tell whether anything happened, or whether a feed
quietly stopped working weeks ago. The list should read:

```
  Buurtagenda Noord      3 nieuw, 12 overgeslagen, 1 verborgen · 2 uur geleden
  Wijkcentrum ’t Anker   laatste sync mislukt: 404 · 6 dagen geleden
```

The second line is the one that earns this decision.

### D8 — Synced events still enter the approval queue

Unchanged: `status: "pending"`, as today. The admin approves as-is, so the step
is light. Making a feed "trusted" so its events publish directly is a
`user-roles-approval` concern and out of scope.

### D9 — Deleting a feed leaves its events alone

Consistent with D3: once imported, the site owns the event. Deleting a feed
removes the feed record only; its events remain, with a `feedId` that no longer
resolves. They simply stop being candidates for cancellation-hiding.

The alternative — hiding a deleted feed's events — would make feed deletion a
destructive content operation, which is not what an admin tidying up a feed
list expects.

## Risks / Trade-offs

- **It is not automatic**, and the user asked for automatic. Accepted
  knowingly (D2). If this proves annoying in practice, a scheduled caller is an
  additive follow-up, not a redesign.
- **Guard 1 means a genuinely cancelled past event stays visible.** Correct
  trade — past events are historical record, and the alternative risks erasing
  the site's history.
- **Adoption (D5) is a write during sync.** It must be surgically limited to
  `feedId`. A careless implementation here reintroduces exactly the clobber
  class that `docs/bugs/recurrence-edit-clobber.md` describes.
- **A rotated feed URL fails silently** apart from the feed list. Guard 2 stops
  it causing damage; D7 is what makes it visible at all. Neither notifies
  anyone — an admin has to look.
- **Feeds that expand recurrences into many distinct UIDs** will create many
  events. Pre-existing behaviour, not introduced here, but persisting feeds
  makes it easier to hit repeatedly.

### D10 — "Sync alle" reports per feed, not one aggregate

An aggregate line ("8 aangemaakt, 40 overgeslagen") hides which feed did what,
and in particular hides *which feed failed*. Since a broken feed is otherwise
invisible (D7), collapsing the report would undo the one mechanism that surfaces
it. Each feed reports its own outcome, and a failure in one never prevents the
rest from running.

### D11 — Feeds can be paused

A feed can be paused: kept, with its URL and defaults intact, but skipped by
"Sync alle". Deletion is not the only way to stop a feed from being pulled.

This matters more than it looks. Without it, the only way to stop syncing a
seasonal or temporarily-broken feed is to delete it — which throws away the URL
and the defaults, and (D9) orphans the `feedId` on every event it produced, so
those events can never be cancellation-checked again even if the feed comes
back. Pausing is reversible; deleting is not.

A paused feed can still be synced explicitly with its own "Sync nu" button —
pausing governs the bulk action, not the deliberate one.

### D12 — A failed sync surfaces on the dashboard

With no scheduler and no notifications, a feed that stops working is silent.
`lastError` on the feeds page only helps someone who thinks to look at the feeds
page — and the reason to look is precisely the thing they do not know.

So the `/beheer` dashboard shows a warning naming each feed whose last sync
failed, with the error message, linking to the feeds page. The dashboard is the
landing page after login, so this is the one place an administrator reliably
sees.

Paused feeds are excluded: a paused feed is not expected to be syncing, so
reporting its stale failure would be noise that trains people to ignore the
warning.

## Open Questions

None outstanding.
