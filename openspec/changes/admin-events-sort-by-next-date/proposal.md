## Why

The events list in the backend sorts and shows an event by its first date. A
weekly event that started in January sits under everything that happened since,
although it also takes place this week; an event with extra dates behaves the
same way. The editor reported this as "sorting by date does not work". The
public agenda already shows an event by its next occurrence; the backend
should order by the same date.

## What Changes

- **The events list sorts by an event's next date**: the next occurrence on or
  after today, from its start, its extra dates or its recurrence rule. An event
  with nothing coming up keeps the date the public page would show (the last
  of a date series, else its start), so past events still sort among
  themselves by when they happened.
- **The Datum column shows that date**, with the recurrence label or the number
  of further dates as now. A weekly event reads "9 okt 2026, 10:00 · Elke
  week" instead of its January start.
- The "Aankomend" filter, blog posts, projects and the other columns are
  unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editorial-backend`:
  - new requirement: **events are listed by their next date**. The sentence
    in the open `admin-content-table` change that says Events are ordered by
    date is amended to point at it.

## Impact

- `src/content/list-query.ts`: the date an event sorts by, from
  `presentOccurrence`.
- `src/components/admin/content-table.tsx`: the Datum cell shows the same
  date.
- `src/app/beheer/(shell)/[type]/page.tsx`: passes today's date to the table.
- Unchanged: stored content, the public pages, the other lists.
