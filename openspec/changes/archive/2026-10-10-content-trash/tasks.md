# Tasks

## 1. Storage (D1, D2, D7, D10)

- [x] 1.1 Add `TRASH_PREFIX = "trash"` and `trashKeyFor(type, slug)` to
      `src/content/storage.ts` beside `CONTENT_PREFIX`, and add
      `/content/trash` to `.gitignore`. Verify with `pnpm typecheck` and
      `git check-ignore content/trash/events/x.mdx`.
- [x] 1.2 Add a pure `markTrashed(raw, trashedAt)` / `markRestored(raw)` pair in
      `src/content/write.ts`: the first adds `trashedAt` to the frontmatter,
      the second removes it and sets `status: "draft"`, both leaving every
      other key and the body untouched. Test in `write.test.ts`: a published
      event round-trips to hidden with `uid` and body intact, and `trashedAt`
      is absent after restore.
- [x] 1.3 Add `trashDocument(type, slug)`, `restoreDocument(type, slug)` and
      `purgeDocument(type, slug)` to `write.ts`. Trash is read live, write
      trash key, remove live key; restore is the reverse and returns
      `{ ok: true } | { ok: false, reason: "taken", title } | { ok: false,
      reason: "missing" }` when the live key is occupied or the trash key is
      gone. Test against a `LocalFsStore` in a temp directory: after trash the
      live key is gone and the trash key exists; after restore the reverse;
      restore onto an occupied slug refuses, names the live title and changes
      neither file.
- [x] 1.4 Add `listTrash()` and `purgeExpired(now)` to `write.ts` with
      `TRASH_RETENTION_DAYS = 30`. `listTrash` lists every type's trash prefix,
      parses each document with gray-matter only, and returns
      `{ type, slug, title, trashedAt, expiresAt }` newest first, using the slug
      as title when no title or name is stored. `purgeExpired` removes entries
      whose `trashedAt` is older than the retention and returns the count. Test:
      a document with a frontmatter that fails the event schema is still
      listed; an item at 31 days is purged and one at 29 days is kept; a missing
      `trashedAt` is treated as expired.

## 2. Actions (D3, D4, D5, D9)

- [x] 2.1 In `src/app/beheer/actions.ts`, make `performDelete` call
      `trashDocument` instead of `deleteDocument`, keeping the all-status
      `findReferences` guard, revalidation and redirects unchanged. Verify in
      the app that trashing an event removes it from the list and the agenda
      and that trashing a referenced venue still lands on `?undeletable=`.
- [x] 2.2 Add `restoreContent`, `purgeContent` and `emptyTrash` actions behind
      `assertAdmin()`. Restore revalidates the type's admin list and redirects
      to `/beheer/prullenbak?hersteld=<slug>` on success or
      `?bezet=<type>:<slug>` when the slug is taken; purge and empty redirect
      with `?verwijderd=1` and `?geleegd=<n>`. Verify with `pnpm typecheck` and
      by calling each from the trash page in task 3.2.
- [x] 2.3 Confirm `deleteFromPublic` needs no change beyond `performDelete`
      and update the `verwijderd` message in
      `src/components/admin/admin-listing-notice.tsx` to "Naar de prullenbak
      verplaatst. Herstellen kan in het beheer." Verify on a public event page
      that Verwijderen lands on the agenda with that notice.

## 3. Backend UI (D6, D8)

- [x] 3.1 Change the Verwijderen confirmation on `src/app/beheer/[type]/page.tsx`
      and `src/components/admin/admin-bar-mount.tsx` to "… naar de prullenbak
      verplaatsen? Je kunt het binnen 30 dagen herstellen." Verify both
      dialogs show the new text.
- [x] 3.2 Build `src/app/beheer/prullenbak/page.tsx` (`force-dynamic`,
      `requireAdmin`): call `purgeExpired` first, then `listTrash`; render a
      "Prullenbak leegmaken" `ConfirmButton` only when the list is not empty;
      each row shows a type badge, title, "in prullenbak sinds" and "verloopt
      op" dates, a Herstellen button and a Definitief verwijderen
      `ConfirmButton` whose message says it cannot be undone; an empty trash
      says "De prullenbak is leeg." Show the `hersteld`, `bezet` (naming and
      linking the live item's edit page), `verwijderd` and `geleegd` notices.
      Verify in the app: trash an event, see it listed with both dates,
      restore it and find it hidden in the events list; trash it again and
      permanently delete it; create a new event with a trashed event's slug
      and see the restore refused with the new event named.
- [x] 3.3 Add a "Prullenbak" stat tile to `src/app/beheer/page.tsx` (count from
      `listTrash().length`, no purge) linking to `/beheer/prullenbak`, and a
      "Prullenbak" entry in `adminNav` in `src/components/admin/admin-shell.tsx`.
      Verify the tile count matches the trash page after trashing two items.

## 4. Verify

- [x] 4.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [x] 4.2 End-to-end in the app: a published venue with one hidden event is
      blocked from the trash and the hidden event is named; trash that event,
      then the venue succeeds; restore the venue and it is hidden; set a
      trashed item's `trashedAt` 31 days back in `content/trash/`, open the
      trash page and confirm it is gone; signed out, `/beheer/prullenbak`
      redirects to sign in. Restore any content files the checks changed.
