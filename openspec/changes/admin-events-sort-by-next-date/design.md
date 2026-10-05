# Design

## Context

`applyListQuery` sorts events by `summary.start`, and the Datum cell shows
`item.start`. `presentOccurrence(event, today)` in `event-presentation.ts` is
what the public event page, its share metadata and its structured data use to
pick the date to show: the next occurrence on or after today, else the last of
a date series, else the start. A summary carries `start`, `end`, `recurrence`
and `dates`, which is all it needs.

## Goals / Non-Goals

**Goals:** the backend orders and labels an event by the date a visitor would
see for it today.

**Non-Goals:** changing how the public agenda orders events; a different date
for ended recurrences (they keep their start, as on the public page).

## Decisions

### D1. One helper, the public page's rule

A pure `eventListDate(summary, today)` in `list-query.ts` returns
`presentOccurrence(summary, today).start`. The `datum` sort uses it for events
(blog posts and projects keep their `date`), and so does the default order.
The time of day is kept, so two events on the same day keep their order.

### D2. The cell shows the same date

`ContentTable` gets a `today` prop from the page, which already computes
`startOfToday()` for the filter, and the Datum cell renders
`eventListDate(item, today)`. The recurrence label, the further-dates count
and the marker badge are unchanged.

Alternative considered: computing the date once in `applyListQuery` and
returning it on the row. It would give the row a field the summary does not
have; passing `today` keeps the summary type as it is.

## Risks / Trade-offs

- [An event's position changes from day to day] → that is the point: it is
  the order the agenda has. The date shown says which occurrence it is.
- [An ended weekly event sorts by its start, not its last occurrence] →
  consistent with its public page; a later change could extend
  `presentOccurrence` for both.
