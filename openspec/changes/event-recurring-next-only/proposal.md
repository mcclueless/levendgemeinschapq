## Why

Events that come back every week on the same day and hour — the Arabic
lessons, the church services — fill the agenda with themselves. A weekly event
contributes thirteen entries to the 90-day agenda, so three such events are
enough to push everything else off the first page, and "39 activiteiten om naar
uit te kijken" describes three activities. A visitor scrolling the agenda is
reading the same title over and over instead of discovering what is on.

The series is still worth one entry: it is a real thing happening next Friday.
What it is not worth is thirteen. An editor should be able to say "show this one
once, at its next date", and have the entry name the rhythm instead of listing
it.

## What Changes

- A recurring event can be set to **show once in listings, at its next
  occurrence**. Its other occurrences are left out of the agenda, the homepage,
  and the listings on venue, organiser, project and blog pages.
- When the shown occurrence is over, the **next one takes its place**, so the
  entry is always the next date the event actually happens.
- The entry **names the rhythm** instead of hiding it. The yellow date box reads
  two lines — "Elke week vr. om 16:30" and "Volgende 16 okt" — in the card and
  text listings; the table view puts "Volgende 16 okt" in its Datum column and
  the rhythm in the Herhaling column it already has.
- A **subtle cue** marks such an entry in listings: a repeat glyph and a thin
  ring on the date box. The rhythm line itself carries the meaning, so the cue
  never has to be seen to be understood.
- It is a **checkbox in the Herhaling section** of the admin event form, off by
  default and meaningful only once a repeat interval is chosen. Every stored
  recurring event keeps showing every occurrence until someone ticks it.
- It applies to **a repeat rule only, never to Extra data**. A date series is an
  irregular handful of dates over a long period — the Stiltevieringen — where
  every date is news. Those listings are unchanged.
- The **event's own page is untouched**: it still presents the series, its rule
  and its `?datum=` deep links exactly as today. The flag changes listings, not
  content.

Not in scope: collapsing a date series (Extra data); a "show the next N"
variant; the public submission form; calendar import setting the flag; a yearly
interval; changing how far the agenda looks ahead.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `events`:
  - **Modified requirement: repeatable (recurring) events.** A recurring event
    MAY be set to contribute one listing entry rather than one per occurrence.
  - **New requirement: a recurring event summarised by its next occurrence.**
    What such an entry shows, when it rolls over, and what is left unchanged.
- `editorial-backend`:
  - **New requirement: choosing to show a recurring event once.** The checkbox
    in the recurrence group, off by default, meaningful only with a rule.

## Impact

- `src/content/schema.ts`, `types.ts`, `repository.ts`, `summaries.ts`: an
  optional flag on an event.
- `src/content/event-series.ts` (new): whether an event collapses, when an
  occurrence counts as passed, and which occurrences a listing gets.
- `src/content/events.ts` (`getUpcomingEvents`): the single place every listing
  draws its occurrences from, so the selection is made once.
- `src/lib/recurrence-label.ts`, `src/lib/date.ts`: the rhythm line, the
  "Volgende" line, and the two formatters they need.
- `src/components/events/event-card.tsx` (`EventCard`, `EventRow`),
  `event-table.tsx`: the two lines and the cue.
- The admin event create and edit forms, `src/app/globals.css`, and the event
  actions in `src/app/beheer/actions.ts`.
- Unchanged: `recurrence.ts` expansion, `event-presentation.ts` and so the
  event page, `occurrenceLink`, the sitemap, structured data, calendar import,
  the public submission form, the review queue, and every stored event. No
  migration: the field is absent from every stored event and absent means off.
