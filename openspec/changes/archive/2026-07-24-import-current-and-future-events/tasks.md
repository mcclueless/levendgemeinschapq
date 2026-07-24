## 1. Shared occurrence helper

- [x] 1.1 Add `firstOccurrenceFrom(start, recurrence, from): Date | null` to `src/content/recurrence.ts` — arithmetic skip-ahead (whole `interval` steps for weekly, month arithmetic reusing `addMonths` for monthly), returning `null` when the series has ended (`until < from`) or a non-recurring `start` is before `from`
- [x] 1.2 Unit-test `firstOccurrenceFrom` (`src/content/recurrence.test.ts`): future one-off, past one-off, weekly with a years-old start, monthly month-end (31st), ended recurrence, open-ended past-start recurrence

## 2. Limit import to current and future events

- [x] 2.1 In `syncFeed` (`src/content/ical-import.ts`), before creating a document, decide keep/skip using the effective end vs `startOfToday()`: one-off `start < today` → skip; mapped weekly/monthly with `firstOccurrenceFrom(...) === null` → skip
- [x] 2.2 For an unexpandable RRULE (`mapRecurrence` returns `undefined` but `item.rrule` is present), skip only when the raw `rrule.options.until` is before today; otherwise import as `pending` with a `reviewNote` asking the editor to set the next date
- [x] 2.3 Reuse `startOfToday()` from `@/lib/date` for the boundary
- [x] 2.4 Fix `mapRecurrence` (found during implementation): node-ical 0.26.x exposes `freq` as a string, not the numeric constant — extract to a `server-only`-free `src/content/ical-recurrence.ts`, accept string/numeric freq, add a regression test parsing real node-ical output (`ical-recurrence.test.ts`)

## 3. Roll recurring starts forward

- [x] 3.1 For a kept weekly/monthly recurrence, store `start = firstOccurrenceFrom(originalStart, mappedRecurrence, today)` instead of the original `DTSTART`
- [x] 3.2 Keep `uidFor` deriving the UID from the feed's original start, so de-duplication and cancellation-hiding are unchanged across re-syncs (verified: `uidFor` untouched)

## 4. Report the past-skipped count

- [x] 4.1 Add `skippedPast: number` to `SyncResult` and increment it wherever an entry is skipped as past
- [x] 4.2 Persist `lastSkippedPast` on the feed (`feeds.ts` schema + `runFeed` in `actions.ts`) and show it as "N verlopen" in the feed last-sync summary (`feeds/page.tsx`)

## 5. Harden the forward scan (conformance fix for the existing events requirement)

- [x] 5.1 Rework `occurrencesInRange` and `nextOccurrence` to jump to `firstOccurrenceFrom(...)` first, then emit at most `MAX_OCCURRENCES` occurrences from there — keeping the output cap but removing the bounded scan from `DTSTART`
- [x] 5.2 Unit-test that an open-ended weekly recurrence with a start well over 60 intervals ago still yields its next future occurrence

## 6. Verify

- [x] 6.1 `pnpm test` (17 pass), `pnpm typecheck`, `pnpm lint` — all clean
- [x] 6.2 Drove the classification with a crafted `.ics` parsed through real node-ical: past one-off skipped; future one-off kept; open-ended weekly/monthly with old starts kept and rolled forward (2024-01-03→2026-07-29, 2023-01-31→2026-07-31); ended weekly skipped; daily kept pending
- [x] 6.3 Re-sync idempotency: `uidFor` still derives from the feed's original start and the existing-entry check is unchanged, so a re-sync skips prior imports (Copy semantics intact) — verified by reading; not run through the live backend
- [x] 6.4 `openspec validate import-current-and-future-events`
