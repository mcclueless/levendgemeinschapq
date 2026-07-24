## Why

Importing an iCal / Google Calendar feed currently creates an Event for **every**
VEVENT in the feed, including its whole history. A feed that carries years of past
entries floods the review queue with events that have already happened. Editors
want a feed to bring in only what is still to come — events from today onwards,
and recurring events that continue into the indefinite future.

## What Changes

- Limit import to current-and-future entries. `syncFeed` skips any entry whose
  last possible occurrence is before today: a one-off dated in the past, or a
  recurrence whose end date has passed. This mirrors the "future-only" stance the
  cancellation-hiding side already takes.
- Keep recurring events that started in the past but still recur (a past
  `DTSTART` with no end, or an end date in the future). For these, the stored
  `start` is **rolled forward** to the next occurrence from today, so the review
  queue shows a real upcoming date rather than a historical one.
- Preserve recurrences the importer cannot expand (e.g. daily/yearly rules, which
  map to no supported interval): if such a rule has not already ended, import it
  as a pending event with a note asking the editor to set the next date, rather
  than silently dropping a genuinely repeating event.
- Report how many entries were skipped as past, alongside the existing
  created/skipped/hidden/flagged counts, so an editor can see the flood was
  stopped.
- **Conformance fix (existing `events` requirement):** harden the occurrence
  expansion so an open-ended recurrence keeps surfacing its next future
  occurrence regardless of how long ago it started. The current implementation
  scans a fixed number of steps from `DTSTART` and stops presenting occurrences
  once the start is far enough in the past — which violates the events spec's
  "Existing open-ended recurrence keeps working" scenario.

## Capabilities

### New Capabilities
<!-- None. This refines existing import and occurrence behaviour. -->

### Modified Capabilities
- `calendar-import`: import is limited to current-and-future entries; recurring
  entries with a past start are imported with their stored start normalised to
  the next occurrence from today; unexpandable-but-active recurrences are kept as
  pending rather than dropped; the sync outcome records a past-skipped count.

<!-- The occurrence-window hardening is a bug fix to conform to the EXISTING
     `events` requirement "Repeatable (recurring) events" (scenario "Existing
     open-ended recurrence keeps working"), so it needs no `events` spec change —
     only implementation and a test. -->

## Impact

- **Code**: `src/content/ical-import.ts` (`syncFeed` gains the date filter,
  start roll-forward, unexpandable-recurrence handling, and a `skippedPast`
  count); `src/content/recurrence.ts` (a shared `firstOccurrenceFrom` helper with
  arithmetic skip-ahead, reused to harden `occurrencesInRange` / `nextOccurrence`);
  `src/content/ical-import.ts` `SyncResult` and the feed last-sync summary in
  `src/app/beheer/actions.ts` / `src/app/beheer/feeds/page.tsx` for the new count.
- **Data**: no schema change. `uid` is still derived from the feed's original
  start, so de-duplication and cancellation-hiding across re-syncs are unaffected;
  only the stored `start` of newly imported recurrences differs.
- **Reused**: `startOfToday()` (`src/lib/date.ts`) for the "today" boundary, so
  import and listings agree on where today begins.
- **Specs**: `calendar-import` delta only.
