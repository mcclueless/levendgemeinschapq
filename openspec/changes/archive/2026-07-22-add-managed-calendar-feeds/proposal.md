## Why

An iCal URL entered at `/beheer/import` is a transient form field. It is used
for one request and then discarded — nothing persists it. Everything the user
experiences follows from that single fact:

- the URL must be re-typed, with its venue and organiser defaults re-chosen,
  every single time;
- there is nothing to list, edit or delete;
- when the source calendar gains a new event, nothing brings it in, because
  there is no record of the feed for anything to re-read.

Reported as "new events are not automatically synced". The underlying problem is
that **there is no feed entity at all.**

A second problem sits behind the reported one and has not been hit yet. Import
is create-only:

```js
if (existingUids.has(uid)) { result.skipped++; continue; }
```

An event **cancelled** in the source calendar therefore stays on the
neighbourhood site indefinitely. That is arguably the most visible of the sync
failures, and re-running an import will never fix it.

## What Changes

- Introduce a **saved calendar feed**: a URL, a label, and the venue/organiser
  defaults that today are re-chosen per import.
- Add **feed management** in the backend — list, add, edit, delete — at a
  dedicated `/beheer/feeds` page. `/beheer/import` becomes the "add a feed" step
  rather than a one-shot form.
- Add a **"Sync nu"** button per feed, plus "Sync alle". Synchronisation is
  manual and explicit; there is **no scheduler**.
- Keep **create-only** semantics for events that already exist: a synced event
  that is already present is skipped, never overwritten. Editorial changes made
  after import are never destroyed.
- **Hide events cancelled at the source**: when a feed no longer lists a UID it
  previously produced, that event is set to hidden (`draft`) rather than
  deleted — subject to three guards that make the rule safe (see Impact).
- Record **`lastSyncedAt` and the last outcome** on the feed, so the list can
  say "3 nieuw, 12 overgeslagen, 1 verborgen · 2 uur geleden" instead of leaving
  the admin guessing whether the button did anything.
- Stamp a **`feedId`** onto imported events so a sync knows which events are
  its own.

## Capabilities

### Modified Capabilities

- `calendar-import`: A calendar feed is saved and re-synchronised on demand
  rather than imported once from a transient URL. Re-synchronisation creates
  events that are new to the site, skips those already present without
  modifying them, and hides those the feed no longer lists. Each feed records
  when it last synced and what happened.
- `editorial-backend`: The backend manages saved calendar feeds — listing,
  adding, editing and deleting them — and offers an explicit synchronise action
  per feed and for all feeds at once.

## Impact

- **Feeds are configuration, not content.** Stored through the existing
  `getStore()` under a `feeds/` prefix — so S3 in production and local
  filesystem in development both work unchanged — but **not** registered in
  `ContentType`. See design D1; this is the load-bearing structural decision.
- **New**: a feed schema and repository module, a `/beheer/feeds` page, and
  feed CRUD + sync server actions.
- **`src/content/ical-import.ts`**: `importFromUrl` gains feed identity, records
  which UIDs the feed currently lists, and returns the hide set.
- **`src/content/schema.ts`**: `EventFrontmatter` gains an **optional**
  `feedId`. Optional deliberately — making it required would make `parseAll`
  skip every event imported before this change, silently removing them from the
  site. Same hazard recorded as D2 in the archived recurrence change.
- **Cancellation-hiding is guarded three ways** (design D4), because the naive
  rule is dangerous: only future-dated events are ever hidden, only when the
  fetch succeeded and returned at least one entry, and only for events carrying
  this feed's `feedId`.
- **Unchanged**: field mapping, RRULE handling, and the approval queue. Synced
  events still arrive as `pending`.
- Nothing globs the content directory — every reader (`repository`,
  `index-build`, `sitemap`, `admin`) names its prefix explicitly — so a `feeds/`
  prefix is inert to existing consumers. Verified.

## Non-Goals

- **Automatic/scheduled synchronisation.** Explicitly declined: this deploys to
  Amplify `WEB_COMPUTE`, which has no cron, and the repository has no scheduler.
  A manual button needs no new infrastructure and no shared secret. See D2.
- **Updating events that changed at the source.** Copy semantics: the site owns
  an event once imported. Cheap to revisit later — the admin approves imported
  events roughly as-is, so update-on-change would be low-risk to add.
- **Deleting cancelled events.** Hiding only; permanent deletion stays a
  deliberate admin action.
- **Auto-publishing trusted feeds.** Synced events keep entering the approval
  queue. Skipping it is a `user-roles-approval` change, not this one.
- Daily/yearly RRULE support, per-occurrence exceptions, or two-way sync.
