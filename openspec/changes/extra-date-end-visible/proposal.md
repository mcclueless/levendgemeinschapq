## Why

On the backend event form, each extra date shows the end it will receive
("tot 22:00") as small grey text under the input, and only once the event's
own start and end are both filled in. The tester reported on 14 October 2026
that the end time of extra dates is hard to see. The value is right and
already in 24-hour notation; its presentation hides it.

## What Changes

- The end an extra date will receive sits **beside the date**, in the same
  size as the date itself, so the row reads as a range: the date and time,
  then "tot 22:00".
- When the end **cannot be shown yet**, the row says why in a short note
  ("Vul eerst het einde van het evenement in" when the event has no end;
  nothing until the date itself is filled), instead of showing nothing, so an
  editor knows what to do rather than wondering whether the end is missing.
- The end still follows edits to the event's start and end and to the date,
  and is still described text on the input, not a live announcement.
- The 24-hour notation of the shown end is unchanged. The native date pickers
  are unchanged: how they display the time follows the browser's language
  setting, which the editor sets on their own machine (decision of 14 October
  2026).

Not in scope: replacing the native date and time pickers; the public
submission form, which takes a single date.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editorial-backend`: requirement **Managing an event's dates** — the end is
  shown beside the date at the date's own prominence, and the form says why
  when it cannot show one.

## Impact

- `src/components/admin/date-list-field.tsx`: the row layout and the empty
  state.
- `src/content/event-dates.ts` (`previewDateEnd`) may need to tell "no end"
  from "no date" so the note can say which.
- No stored content, no API, no migration.
