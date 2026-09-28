## Why

A user reports that the new extra dates on an event "miss an end time". The model
is not the problem. A series works on the premise that every date has the same
start and end times, and each extra date already ends at its start plus the first
date's duration. What is missing is that nobody can see it.

- **Editors** enter each extra date's start and never see the end it will get.
  Only a hint in the form says every date lasts as long as the first.
- **Visitors** see no end time on an event page at all, for the main date or for
  the other dates. That gap predates the extra dates, but a series page showing
  several dates makes it obvious. The end reaches a visitor only through the
  agenda's table view.

## What Changes

- The **event page shows the end time**: "20:00–22:00" on the presented date and
  on each of the other dates, wherever the occurrence has an end. This applies to
  every event with an end, not only series.
- The **admin date rows show the end each date will get**, such as "tot 22:00",
  derived from the event's start and end. The preview updates as those fields
  change.
- The table view and the event page format a time range through **one shared
  helper**, so they cannot disagree.

Not in scope, by the premise above: an end time set per date. Also not in scope:
end times on image cards and text rows, an end in share previews, and a separate
display for events lasting a day or more.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `events`:
  - **Single event view**: the page shows the end time of the presented date and
    of each other date.
- `editorial-backend`:
  - **Managing an event's dates**: the form shows the end each further date will
    receive.

## Impact

- `src/lib/date.ts`: a `formatTimeRange` helper, taking the rule the table view
  uses today.
- `src/components/events/event-table.tsx`: uses the helper.
- `src/app/agenda/[slug]/page.tsx`: the date badge and the other-dates list show
  a time range.
- `src/components/admin/date-list-field.tsx`: a derived-end preview per row.
- No change to stored data, the schema, or how occurrences are computed. No
  migration.
