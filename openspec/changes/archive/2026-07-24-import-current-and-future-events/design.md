## Context

`syncFeed` (`src/content/ical-import.ts`) maps every VEVENT to an Event with no
date filter — the only guard is `type === "VEVENT" && i.start` (line 96). So a
feed carrying its history imports its history.

The codebase already reasons the way we want on the *other* side of sync:
`hideCancelled` guard 2 skips past events with the comment *"Feeds commonly
publish a rolling window and drop past entries."* The creation side simply never
got the symmetric future-only stance.

Two facts shape the fix:

1. A recurring event's stored `start` is its `DTSTART`, often in the past, even
   though it recurs into the future. "From today onwards" therefore cannot be
   `start >= today`; it must consider the recurrence's *end*.
2. Occurrence expansion (`occurrencesInRange` / `nextOccurrence` in
   `recurrence.ts`) steps forward from `start`, capped at `MAX_OCCURRENCES = 60`.
   A recurrence whose `DTSTART` is more than 60 intervals before today never
   reaches today within the scan and stops appearing — silently violating the
   `events` spec scenario "Existing open-ended recurrence keeps working".

`syncFeed` is the single importer (called from `actions.ts:753` for both first
import and re-sync), so the filter lands in exactly one place.

## Goals / Non-Goals

**Goals:**
- Import only entries that are current or future; skip fully-past entries.
- Keep still-recurring events whose start is in the past, and store an upcoming
  start for them so they read cleanly in the review queue and display correctly.
- Never silently drop a genuinely repeating event we cannot expand.
- Make open-ended recurrences surface correctly regardless of start age
  (conformance with the existing `events` requirement).

**Non-Goals:**
- No new recurrence frequencies (daily/yearly stay unsupported for expansion;
  they are kept as pending, not expanded).
- No change to de-duplication, cancellation-hiding, or Copy semantics.
- No schedule/automation change — sync stays on-demand.

## Decisions

### D1 — Cut on the recurrence's effective end, reusing `startOfToday()`
An entry is skipped at import when its last possible occurrence is before
`startOfToday()`:
- one-off: `start < today`;
- weekly/monthly recurrence: recurrence end (`until`) `< today`;
- open-ended recurrence: never skipped (it reaches into the indefinite future).
Reusing `startOfToday()` keeps the import boundary identical to the listings'.

### D2 — One helper: `firstOccurrenceFrom(start, recurrence, from)`
A new pure function returns the first occurrence at or after `from`, or `null`
when the series has fully elapsed. It computes the jump **arithmetically** (whole
`interval` steps for weekly; month arithmetic for monthly), so it is not bounded
by a step cap. It drives three things at once:
- the keep/skip test (`null` → skip);
- the rolled-forward start for kept recurrences (the returned date);
- the hardened forward-scan in `occurrencesInRange` / `nextOccurrence` (D5).

*Alternative considered:* reuse the existing 60-step `nextOccurrence` as the
filter — rejected: it inherits the window bug, so a long-running weekly event
would be wrongly judged "past".

### D3 — Roll the stored start forward for kept weekly/monthly recurrences
A kept recurrence is written with `start = firstOccurrenceFrom(origStart, rec,
today)`. The review queue then shows the next real date, not a historical one.
`uidFor` continues to derive the UID from the feed's *original* start, so
re-syncs still recognise the entry (dedup) and cancellation-hiding still matches
by UID — only the stored `start` changes, and only for newly created events.
Re-sync skips existing events (Copy semantics), so the roll happens once.

### D4 — Keep unexpandable-but-active recurrences as pending
When an entry has an RRULE the importer cannot map to a supported interval
(daily/yearly, or anything `mapRecurrence` returns `undefined` for), the keep/skip
test falls back to the raw RRULE end: skip only if its `UNTIL` is already past.
Otherwise import it as a `pending` event, storing the original start and a
`reviewNote` asking the editor to set the next date. This honours the user's
choice to preserve, not drop, genuinely repeating events — flagged for review
rather than lost.

### D5 — Harden the forward scan (conformance fix, no `events` spec change)
`occurrencesInRange` and `nextOccurrence` first jump to
`firstOccurrenceFrom(...)` and then emit at most `MAX_OCCURRENCES` occurrences
from there, instead of counting steps from `DTSTART`. The output cap is
preserved; only the *scan* to reach `from` becomes unbounded. This makes the
existing requirement "Existing open-ended recurrence keeps working" actually
hold for any start age — protecting hand-authored and pre-existing imported
events too, not only new imports. It is recommended and separable: it can ship
in the same change or be dropped without affecting the import filter.

### D7 — Fix the RRULE frequency mapping (found during implementation)
node-ical 0.26.x exposes `rrule.options.freq` as a **string** ("WEEKLY",
"MONTHLY", …) through its `RRuleCompatWrapper`, not the numeric rrule constant the
existing `mapRecurrence` compared against (`=== 2`). That check matched nothing,
so every recurring entry was silently imported as a one-off — and the D3
roll-forward, which only runs for a mapped weekly/monthly recurrence, would never
fire. The mapping is extracted to a `server-only`-free `ical-recurrence.ts`,
accepts both the string and the legacy numeric forms, and is covered by a
regression test that parses real node-ical output. This restores the existing
"Recurrence import" behaviour rather than adding a requirement.

### D6 — Report a `skippedPast` count
`SyncResult` gains `skippedPast`, surfaced in the feed's last-sync summary next
to created/skipped/hidden/flagged, so an editor sees the past flood was stopped.
Counted separately from `skipped` (which means "already present"), to keep the
dedup count meaningful.

## Risks / Trade-offs

- **Monthly roll-forward month-end drift** (e.g. a rule anchored on the 31st) →
  reuse the existing `addMonths` semantics already used by expansion, so import
  and display agree; cover the 31st→short-month case with a test.
- **"Today" and timezones** → use `startOfToday()` (server-local midnight),
  identical to listings; all-day and cross-timezone entries are judged on the
  same boundary the rest of the site uses. Documented, not separately solved.
- **Multi-day one-off spanning today** (started yesterday, ends tomorrow) → cut on
  `start`, consistent with `occurrencesInRange`, which already would not list it
  as upcoming; accepted rather than special-cased.
- **Rolling the stored start loses the original `DTSTART`** → acceptable for an
  upcoming-events site that never surfaces the historical first date; the
  recurrence rule and UID are preserved.
