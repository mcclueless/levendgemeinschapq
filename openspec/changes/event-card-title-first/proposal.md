## Why

In the agenda's card view each card shows the yellow date box first, then the
title, then the location. The tester asked on 14 October 2026 for the title
and location at the top and the yellow box at the bottom, so a visitor reads
what the event is before when it is.

## What Changes

- In the image (card) variant of the event listings, each card shows, under
  its image, the **title** first, the **location** under it, and the **date
  box** last.
- Proposed: an agenda **marker**'s card follows the same order, title then
  date, so the grid stays uniform; today its spec pins date before title.
  Alternative, if the request meant ordinary events only: markers keep date
  then title. To confirm before the specs are written.
- The date box keeps its content: date and time, or the rhythm and next date
  of a recurring event, and the external mark on the title stays.
- The text-only and table variants are unchanged.

Not in scope: the event page itself; the text-only listing; the table.

Sequencing: `src/components/events/event-card.tsx` is also touched by the two
in-flight changes `event-recurring-next-only` and `event-external-link`, whose
remaining tasks are a live test. The user asked on 14 October 2026 to apply
this change anyway; it builds on their deployed code with a small diff.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `events`: requirement **Listing display variants** gains the card's order
  (title, location, date); requirement **Agenda markers without a page** has
  its card scenario reordered to match.

## Impact

- `src/components/events/event-card.tsx`: `EventCard` and `MarkerCard`.
- Any listing test or snapshot that asserts the card's order.
- No stored content, no API, no migration.
