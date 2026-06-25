## 1. Reference scan: two strictness levels

- [x] 1.1 Parameterize `findReferences(type, slug, { includeHidden })` in `src/content/admin.ts` — `includeHidden: false` (default) keeps the current published-only behavior; `true` counts referrers of any status. Still returns empty for event/blog targets.
- [x] 1.2 Confirm `hideContent`/`performHide` keep published-only semantics (call with the default).

## 2. Generalized delete action + guard

- [x] 2.1 Generalize `performDeleteEvent(slug)` → `performDelete(type, slug)` in `src/app/beheer/actions.ts`: for `venue`/`organiser` run the all-status guard (`findReferences(..., { includeHidden: true })`) and report blocked; for `event`/`blog` delete unguarded. Calls `deleteDocument(type, slug)` + revalidate.
- [x] 2.2 Add a generalized admin-list delete action (reads `managedType` + `slug`) → `performDelete`; on block, redirect to the admin list with a distinct `?undeletable=<slug>` signal; on success redirect to the admin list.
- [x] 2.3 Keep `deleteEvent`'s existing behavior working (or route it through `performDelete("event", slug)`).

## 3. Admin list UI

- [x] 3.1 In `src/app/beheer/[type]/page.tsx`, render the "Verwijderen" action for every type (remove the `type === "event"` condition), each posting `type` + `slug` to the generalized delete action, with the strong `ConfirmButton` confirmation.
- [x] 3.2 Handle `?undeletable=<slug>`: re-run the scan with `includeHidden: true` and show a named, linked list of the blocking referrers (distinct from the hide `?blocked=` published list).

## 4. Public admin banner

- [x] 4.1 Show "Verwijderen" for all content types in `src/components/admin/admin-bar-mount.tsx` (drop the events-only condition).
- [x] 4.2 Generalize `deleteFromPublic` to all types via `performDelete`: on success revalidate and redirect to that type's public listing with a confirmation; on block redirect to the backend list with the named referrers (`?undeletable=`).

## 5. Verification

- [x] 5.1 Verify deleting a Venue/Organiser referenced by a published, a past, AND a hidden/draft event is each blocked and names the referrer; verify it succeeds once nothing references it.
- [x] 5.2 Verify a Venue referenced only by a hidden event can still be hidden (published-only hide guard) but cannot be deleted (all-status delete guard).
- [x] 5.3 Verify Blog posts and Events delete without a guard; verify Verwijderen appears for all four types on the admin list and the public banner.
- [x] 5.4 Run `npm run typecheck` and `npm run lint`.
