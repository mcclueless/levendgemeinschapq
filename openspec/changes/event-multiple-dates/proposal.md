## Why

An event happens on one date, or repeats weekly or monthly. A concert series on
3 October, 17 October and 8 November fits neither: today it has to be entered as
three separate events. Three copies means editing the text three times, three
permanent URLs that read `concertserie-2` and `-3`, and three near-identical
pages competing in search results. Cancelling one night means deleting an event.

That is the case the editor actually has, and it is common: a series of concerts,
a workshop given three times, a market on scattered Saturdays.

## What Changes

- An event MAY carry **further dates** beyond its start. Each date surfaces as its
  own upcoming occurrence, so the agenda and the homepage list them all, exactly
  as three separate events did.
- **One page for the series.** The event page presents the next date still to
  come, lists the others, and shows dates that have passed as past rather than
  hiding them.
- **A specific date can be linked** with `?datum=YYYY-MM-DD`, so a poster or a
  listing row can point at one night. The event's canonical URL stays the bare one.
- **Every date shares the event's duration**: the end time is the start's duration
  applied to that date, which is already what the table view shows.
- **Repetition and a date list are mutually exclusive.** An event repeats on a
  rule, or it names its dates.
- The **admin create and edit forms** gain a date list — add, remove, with each
  date carrying its own time. The **public submission form keeps one date**.
- **BREAKING for structured data (a fix):** an event page's structured data
  currently pairs the occurrence being shown with the *first* occurrence's end
  time. Each occurrence now reports its own end.

Not in scope: reading `RDATE` from calendar feeds (the obvious follow-up, once
events can hold a date list), a different end time per date, and multi-date
submissions from the public form.

## Capabilities

### Modified Capabilities

- `events`:
  - **Event entity and fields** — an optional list of further dates.
  - **Repeatable (recurring) events** — a repeat rule and a date list are
    mutually exclusive.
  - **Upcoming-only listing with limit and "See more"** — each date is an
    occurrence.
  - **Single event view** — the page presents the series: next date, the other
    dates, past ones marked, and a linkable single date.
- `editorial-backend`:
  - New requirement for managing an event's dates in the backend, including that
    the list survives a save from a form that does not show it.

## Impact

- `src/content/schema.ts` — the optional list, parsed as site time like `start`.
- `src/content/recurrence.ts` — `occurrencesInRange` and `firstOccurrenceFrom`
  merge the listed dates. Every listing, the homepage, the table view, the
  venue/organiser pages and the importer's roll-forward read through these.
- `src/app/agenda/[slug]/page.tsx` — the series on the page, and `?datum=`.
- `src/lib/structured-data.ts` — the end time per occurrence.
- `src/app/beheer/**` — the date list on the admin forms; the public submission
  form is unchanged.
- No migration: events without the field behave exactly as they do now.
