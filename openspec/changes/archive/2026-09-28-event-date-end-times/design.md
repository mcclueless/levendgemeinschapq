## Context

Every occurrence already carries its end. `occurrenceEnd(event, start)` returns
the occurrence's start plus the duration between the event's start and end. The
listing query attaches that end to every occurrence, and the event page's
presentation does the same for the presented date and for each other date.

```
 occurrenceEnd ──┬──▶ table view      shows "20:00–22:00"
                 ├──▶ structured data  endDate
                 ├──▶ event page       ✗ start time only
                 └──▶ admin rows       ✗ not computed at all
```

So this change is about display. The data is already correct, and a series works
on the premise that every date shares the same start and end times.

## Goals / Non-Goals

**Goals:**
- A visitor sees when an occurrence ends, on the event page, for every date
  listed there.
- An editor sees the end each extra date will get before saving.

**Non-Goals:**
- An end set per date.
- End times on image cards and text rows. Those stay compact.
- An end in share previews.
- A distinct display for an occurrence lasting a day or more.

## Decisions

### D1. One time-range formatter

`formatTimeRange(start, end?)` moves into `lib/date`. It returns "20:00–22:00"
when `0 < end − start < 1 day`, and otherwise the start time alone. That is the
table view's rule today, including leaving out a meaningless "00:00–00:00". The
table view and the event page both call it, so they cannot disagree.

*Alternative: show an end date for events lasting a day or more.* Left out. No
series needs it, and it adds a second display format to design and test.

### D2. The page reads the end it already has

The presentation passed to the page already carries `end` for the presented
date and for each other date. The date badge renders
`formatDateLong(start) · formatTimeRange(start, end)`. Each entry in the
"Ook op" list renders `formatDate(start) · formatTimeRange(start, end)`. No new
computation, and no change to the presentation module.

### D3. The admin preview is computed in the browser

Under each date row the client component shows "tot 22:00". The value is that
row's start plus the duration between the form's `#start` and `#end` inputs,
formatted in Amsterdam time. It listens for input on those two fields and on its
own rows, so it follows edits before saving. It shows nothing when the event has
no end, the row has no start, or the duration is zero or more than a day,
matching D1.

The rule is the one `occurrenceEnd` applies on the server. It is small enough to
repeat in the component. Sharing the module would pull server-side date code
into the client bundle for one subtraction.

Without JavaScript no preview appears. The form still submits correctly.

The preview is announced politely to assistive technology: it sits in the row,
associated with the row's input through `aria-describedby`, rather than in a
live region that would speak on every keystroke.

## Risks / Trade-offs

- **[Preview disagrees with what is saved]** The browser and the server compute
  the end separately. → Same rule on both sides. The browser check compares the
  preview with the table view after saving.
- **[Wall time in the browser]** The preview must format in Amsterdam time
  whatever the editor's device timezone. The start and end inputs are Amsterdam
  wall time already, so the duration is a plain difference. → Format with an
  explicit `timeZone`, and test on a device set to another zone.
- **[Page badge grows]** "zaterdag 3 oktober 2026 · 20:00–22:00" is longer. → The
  badge already wraps; check it at phone width.

## Migration Plan

None. Deploy, then check that Stilteviering's page shows 19:30–20:30 on each of
its dates. Rollback is a revert.

## Open Questions

None.
