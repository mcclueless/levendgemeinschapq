## 1. Feed persistence

- [x] 1.1 Add a feed schema (zod): `url`, `label`, `defaultVenue`, `defaultOrganiser`, `paused` (default false), plus sync bookkeeping (`lastSyncedAt?`, last counts, `lastError?`)
- [x] 1.2 Store feeds through the existing `getStore()` under a `feeds/` prefix, so the S3/local split is inherited unchanged
- [x] 1.3 **Do NOT add `feed` to `ContentType`.** It has no public page, so `PUBLIC_PATH` (`admin.ts:129`), `PUBLIC_LIST_PATH` (`routes.ts:54`) and `itemPath()` (`revalidate.ts:50`) would each need an invented URL, and `listContent` assumes a `PublishStatus` a feed does not have (design D1)
- [x] 1.4 Add a small feed repository: list, get, create, update, delete — mirroring `write.ts`'s shape but independent of the content-type machinery
- [x] 1.5 Confirm the new prefix is invisible to existing readers — `repository.ts`, `index-build.ts`, `sitemap.ts` and `admin.ts` each enumerate prefixes explicitly, so nothing should pick feeds up

## 2. Event ↔ feed linkage

- [x] 2.1 Add `feedId` to `EventFrontmatter` as **optional** — required would make `parseAll` silently skip every event imported before this change, removing them from the site and the backend list (design D5)
- [x] 2.2 Stamp `feedId` on events created by a synchronisation
- [x] 2.3 Implement adoption: when a sync sees an existing event whose UID is in this feed's fetch and which has no `feedId`, write `feedId` **and nothing else** — a broader write here reintroduces the clobber class from `docs/bugs/recurrence-edit-clobber.md` (design D5)

## 3. Sync engine

- [x] 3.1 Refactor `importFromUrl` in `src/content/ical-import.ts` to take a feed (id + url + defaults) and return created / skipped / hidden / flagged counts plus errors
- [x] 3.2 Keep create-only semantics: an entry whose UID already exists is skipped and the existing event is left untouched (design D3)
- [x] 3.3 Collect the set of UIDs the feed currently lists, for the cancellation pass
- [x] 3.4 Cancellation pass — hide an event only when **all four** hold (design D4):
  - it carries this feed's `feedId`
  - its `start` is in the future
  - its UID is absent from the current fetch
  - the fetch succeeded **and** returned at least one entry
- [x] 3.5 Hide by setting `status: "draft"` via the existing status path — never delete (design D4)
- [x] 3.6 Guard explicitly against the empty-fetch case: zero entries technically means "everything cancelled" and almost always means a rotated URL or auth failure. Hide nothing; report it
- [x] 3.7 Write `lastSyncedAt`, the counts, and any error back onto the feed (design D7)
- [x] 3.8 Keep the sync entry point a plain function with no request-scoped dependencies, so a scheduled caller can be added later without restructuring (design D2)

## 4. Backend UI

- [x] 4.1 Add `/beheer/feeds` — list every feed with label, URL, defaults, last-synced time and last outcome
- [x] 4.2 Add / edit / delete forms for a feed, reusing the existing admin form primitives and `FormError`
- [x] 4.3 Add a "Sync nu" action per feed
- [x] 4.4 Add a "Sync alle" action that continues past a failing feed and reports which one failed
- [x] 4.5 Rework `/beheer/import` into the "add a feed" entry point (or link it to `/beheer/feeds`), so the one-shot form stops being the only way in
- [x] 4.6 Surface a failed last-sync prominently in the list — nothing else will ever tell anyone a feed has stopped working
- [x] 4.7 Add a link to the feeds page from the `/beheer` dashboard
- [x] 4.8 Deleting a feed must not touch its events (design D9)
- [x] 4.9 Add pause/resume actions and show the paused state in the list (design D11)
- [x] 4.10 Have "Sync alle" skip paused feeds, while "Sync nu" still works on a paused feed (design D11)
- [x] 4.11 Report "Sync alle" results **per feed**, not as one aggregate — an aggregate would hide which feed failed, undoing D7 (design D10)
- [x] 4.12 Warn on the `/beheer` dashboard for every non-paused feed whose last sync failed, naming it, showing the error, and linking to the feeds page; exclude paused feeds so the warning stays trustworthy (design D12)

## 5. Verification

- [x] 5.1 Save a feed, sync it, confirm events are created as `pending` and the feed persists with its defaults intact
- [x] 5.2 Sync the same feed again with no source changes — confirm zero created, all skipped, nothing modified on disk
- [x] 5.3 Edit an imported event (venue, description, cover), re-sync, confirm every edit survives (design D3)
- [x] 5.4 Add an entry to the source feed, sync, confirm only the new event is created
- [x] 5.5 Remove a **future** entry from the source feed, sync, confirm that event is hidden (`draft`) and reported — and still present in the backend
- [x] 5.6 Remove a **past** entry from the source feed, sync, confirm it is **not** hidden (guard 1)
- [x] 5.7 Point a feed at an unreachable URL, sync, confirm nothing is hidden, the error is recorded on the feed, and it is visible in the list (guard 2)
- [x] 5.8 Point a feed at a valid but empty calendar, sync, confirm nothing is hidden (guard 2)
- [x] 5.9 Create an event by hand with a UID that collides with a feed entry, remove that entry from the feed, sync, confirm the hand-made event is untouched (guard 3)
- [x] 5.10 With an event imported before this change (UID, no `feedId`), confirm it still parses, renders and lists — then sync its feed and confirm it is adopted with only `feedId` written
- [x] 5.11 Delete a feed, confirm its events remain published and unaltered
- [x] 5.12a Pause a feed, run "Sync alle", confirm it is skipped and its recorded outcome is unchanged — then "Sync nu" it directly and confirm it still syncs
- [x] 5.12b Break one feed, run "Sync alle" with several feeds, confirm each reports its own outcome and the failure does not stop the others
- [x] 5.12c Confirm the dashboard warns about the broken feed with its error message, goes quiet once fixed, and stays quiet for a paused broken feed
- [x] 5.12 Confirm `/beheer/feeds` is unreachable unauthenticated and that no feed URL appears in any public page payload
- [x] 5.13 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`
