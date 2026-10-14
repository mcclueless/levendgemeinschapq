## Context

`date-list-field.tsx` renders each further date as a row: a `datetime-local`
`Input` and a "Verwijderen" button, and under them, only when
`previewDateEnd` returns a time, a `<p class="text-xs text-muted">tot 22:00</p>`
that the input references with `aria-describedby`. `previewDateEnd` in
`event-dates.ts` returns `undefined` for every case it cannot show: empty or
unreadable inputs, and a duration that is zero, negative or a day or more,
matching `formatTimeRange`.

The native pickers stay (decision of 14 October 2026); the shown end is
already 24-hour via `formatTime`.

## Goals / Non-Goals

**Goals:** the end reads as part of the date row, at the date's size; a filled
date with nothing to show says why when the cause is a missing start or end.

**Non-Goals:** replacing the pickers; changing how the end is derived; the
public form.

## Decisions

### D1. The end sits beside the input, at the input's size

The row becomes `flex flex-wrap items-center gap-2`: the input, then
`<span>tot 22:00</span>` in `text-base text-ink` with a `whitespace-nowrap`,
then "Verwijderen". On a narrow screen the span wraps under the input, still
at full size. The span keeps its id so `aria-describedby` still reads it with
the field.

*Alternative:* bolder text under the input. Rejected: it still reads as a
footnote, which is the complaint.

### D2. A note when the cause is fixable, nothing otherwise

A new helper `previewDateEndNote(date, start, end)` beside `previewDateEnd`
returns `"Vul eerst de start en het einde van het evenement in"` when the row
is filled and readable but the event's start or end is empty or unreadable,
and `undefined` otherwise. The row shows the note in `text-sm text-muted` in
the place the end would take, and the input describes it the same way.

Zero, negative or day-long durations stay silent: the server shows no end
there either (`formatTimeRange`), so a note would promise an end that will not
appear.

*Why a separate helper rather than a richer return type:* `previewDateEnd`
has callers and tests that expect a string; the note is one more pure
function with its own tests, and the row calls both.

### D3. Marker mode is unchanged

A marker's rows are `date` inputs with no time, and the form's start has no
time either; `previewDateEnd` already returns nothing there, and the note must
too: the helper returns `undefined` when the row value has no time part.

## Risks / Trade-offs

- [The note nags while an editor is still filling the form top to bottom] →
  it appears only once a further date is filled, which usually comes after
  start and end.
- [Row width on phones] → the row wraps; verified in task 2.1.
