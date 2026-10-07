## Context

See proposal.md for the motivation. The current state that shapes this design:

- `deleteDocument` (`src/content/write.ts`) is `store.remove(key)`: S3 `DeleteObject` in deployment, `unlink` locally. Nothing retains the object.
- The `ContentStore` interface is `list`, `read`, `readPrefix`, `write`, `remove`, keyed by `<prefix>/<slug>.mdx` with `CONTENT_PREFIX` per type. Every reader lists a per-type prefix: the public repository, `listContent`, `getContentCounts`, `findReferences`, `findImageReferences`, `buildIndex`, the importer's saved-UID map, `uniqueSlug`, and the permalink "taken" check.
- `performDelete` in `src/app/beheer/actions.ts` runs the all-status reference guard, then deletes, revalidates, and redirects. The backend list and the public admin bar both call it; a blocked delete lands on the list with `?undeletable=<slug>` and the page re-runs the scan to name referrers.
- `PublishStatus` is `draft | pending | published`. Hidden means `draft`.
- The app has no scheduler: feed sync is a manual action by design.
- The committed `content/` directory is a build-time seed; runtime reads S3.

## Goals / Non-Goals

**Goals:**
- No reader change: everything that lists live content keeps working untouched.
- Trash, restore, and purge composed from the existing store operations, with no new backend-specific code.
- Nothing in the trash can ever be referenced by live content, so purge is guard-free.
- A trashed document can be listed, restored, and purged even if it no longer validates against the current schema.

**Non-Goals:**
- Media and feed deletion (they keep immediate delete).
- Scheduled or infrastructure-level expiry (S3 lifecycle rules).
- Protecting a trashed item's cover image from gallery deletion.
- Teaching the calendar importer about trashed UIDs.
- Bulk restore.

## Decisions

### D1 — A trash prefix, not a trash status
A trashed document moves from `<CONTENT_PREFIX[type]>/<slug>.mdx` to `trash/<CONTENT_PREFIX[type]>/<slug>.mdx`. `storage.ts` gains a `TRASH_PREFIX` constant and a `trashKeyFor(type, slug)` helper beside `keyFor`.

- *Why:* every reader lists a per-type prefix. Moving the file out of it hides the item from the public site, lists, counts, index, reference guard, image-reference scan, importer, unique-slug and permalink checks with zero changes to any of them. A fourth `PublishStatus` value would require a filter in each of those readers, and a missed one would leak a trashed item into a list or a guard.
- *Alternative rejected:* S3 versioning plus `DeleteObject` with restore from the version history. No local analog, nothing to list in a UI without extra API calls, and the local store could not emulate it.
- *Alternative rejected:* a `trashed` status. See above; also the schema would need a status that no public page may ever render.

### D2 — Trash is read + write + remove; restore is the reverse
`write.ts` gains `trashDocument(type, slug)`, `restoreDocument(type, slug)`, `purgeDocument(type, slug)`, and `listTrash()`. Trash reads the live document, writes it to the trash key with a `trashedAt` ISO timestamp added to the frontmatter, then removes the live key. Restore reads the trash key, writes it to the live key with `trashedAt` removed and `status: "draft"`, then removes the trash key. Purge is `remove(trashKey)`.

- *Why write-then-remove:* a crash between the two steps leaves a copy rather than losing the document. A duplicate (live and trashed) is harmless: the trash page can show it and the next trash or restore reconciles.
- *Why a frontmatter marker rather than object metadata:* the local backend has no metadata, and the marker must survive both backends identically. It is one extra key that `serialize` already handles.

### D3 — The all-status guard stays at trash time; purge has no guard
`performDelete` keeps its `findReferences(type, slug, { includeHidden: true })` check and then calls `trashDocument` instead of `deleteDocument`. Purge and empty-trash run no guard.

- *Why:* the guard exists to stop an irreversible action from orphaning references. If a referenced venue can never enter the trash, nothing in the trash is referenced and purge is safe by construction. The existing `?undeletable` redirect and the message naming referrers are reused unchanged.
- *Alternative rejected:* relax trash to the published-only hide guard and move the all-status guard to purge. The admin would then be blocked at "empty trash" with far less context about what to reassign, and a trashed-then-restored referrer could re-introduce a dangling link.

### D4 — Restore always lands as hidden
`restoreDocument` writes `status: "draft"` regardless of the stored status.

- *Why:* a restore after days or weeks should not silently republish. The per-type list already offers Publiceren on a hidden item, so going live is one deliberate click away.
- *Alternative rejected:* restore to the prior status. Simpler to explain, but a published item would reappear on the agenda and homepage the moment it is restored, with no review.

### D5 — Restore refuses a slug collision and names the blocker
Before writing, `restoreDocument` reads the live key. If a document exists there, restore returns `{ ok: false, reason: "taken", title }` and the trash page shows "kan niet hersteld worden: de permalink is nu in gebruik door …", linking the live item's edit page.

- *Why:* trashing frees the slug (D1), so a new item may have taken it. The permalink feature already rules that a collision is refused, never resolved by suffixing; restore follows the same rule. The admin can rename the live item's permalink and retry.

### D6 — Lazy expiry on the trash page, 30 days
The trash page calls `purgeExpired(now)` before listing: every trashed document whose `trashedAt` is older than 30 days is removed. `TRASH_RETENTION_DAYS = 30` lives beside the write helpers. The dashboard count does not purge; it only counts.

- *Why on the page, not the dashboard:* the dashboard must stay fast and side-effect free; it is the page every admin sees. Opening the trash is the moment the admin is looking at retention anyway, and the page shows each item's expiry date so the purge is never a surprise.
- *Why no scheduler:* there is none in the app and the project deliberately keeps feed sync manual. An S3 lifecycle rule would be infra outside this repo with no local analog.
- *Trade-off:* an item older than 30 days survives until someone opens the trash page. Acceptable: the only cost is storage.

### D7 — The trash page parses leniently
`listTrash()` lists `trash/` and reads each document with `gray-matter` only, picking `title ?? name ?? slug`, `trashedAt`, and the type from the key. It does not run the type's zod schema.

- *Why:* a document trashed months ago may predate a schema change; a validation failure must not make it impossible to list, restore, or purge. Restore reinstates the raw document, after which the normal loaders report any schema problem the same way they do for live content.

### D8 — UI wording and placement
- Per-type list and public banner: the button stays "Verwijderen"; the confirmation becomes "… naar de prullenbak verplaatsen? Je kunt het binnen 30 dagen herstellen." The irreversible wording moves to the trash page.
- Trash page at `/beheer/prullenbak`: one list across types, newest first, each row with a type badge, title, "in prullenbak sinds", "verloopt op", and buttons Herstellen and Definitief verwijderen (confirm). A "Prullenbak leegmaken" button (confirm) above the list when it is not empty.
- Dashboard: a "Prullenbak" stat tile linking to the page. Admin shell: a nav entry.
- Public banner success flag stays `?beheer=verwijderd`; the listing notice wording mentions the trash.

### D9 — Revalidation
Trash revalidates exactly what delete did (`revalidateAfterItemChange` plus the admin list). Restore revalidates the admin list only, since a hidden item changes nothing public. Purge revalidates nothing public.

### D10 — Local trash is git-ignored
`content/trash/` is added to `.gitignore`. The committed `content/` is a build seed; trashed local documents must not ride into a commit or be read at build time.

## Risks / Trade-offs

- [Imported feed events come back] → Inherited from today's hard delete: the importer de-duplicates against live events, so a trashed feed event is re-created on the next sync. Documented as out of scope; the fix is to let the importer also read `trash/events` UIDs, a follow-up change.
- [Cover image of a trashed item looks unused] → `findImageReferences` scans live prefixes only, so the gallery may let the admin delete it; a later restore shows a broken image. Accepted for this change, same as today's delete. Restore lands hidden, so the admin sees the item before it goes public.
- [Trashed referrer no longer blocks] → A trashed event no longer protects its venue; restoring the event later would dangle. References already degrade to "no venue" in every loader, and the restored event is hidden, so the admin can fix it before publishing.
- [Two-step move is not atomic] → Write-then-remove means a crash leaves a duplicate rather than a loss. The next trash/restore of that slug reconciles it.
- [Expired items linger until the page is opened] → Only storage cost; the dashboard count may be slightly high until then.
- [Verwijderen now means something different] → Mitigated by the new confirmation text that says the item goes to the trash and can be restored.

## Migration Plan

No data migration: existing documents are untouched and the trash starts empty.
1. Storage helpers: `TRASH_PREFIX`, `trashKeyFor`, `trashDocument`, `restoreDocument`, `purgeDocument`, `purgeExpired`, `listTrash`, with unit tests on the local store.
2. `performDelete` moves instead of removing; new actions `restoreContent`, `purgeContent`, `emptyTrash`.
3. Trash page, dashboard tile, nav entry, confirmation wording on the list and banner.
4. `.gitignore` entry for `content/trash/`.

Rollback: point `performDelete` back at `deleteDocument` and remove the page. Anything already in the trash stays in S3 under `trash/` and can be moved back by hand or purged.
