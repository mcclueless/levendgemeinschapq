## Context

```
 EventFrontmatter          occurrencesInRange(start, recurrence, from, horizon)
 ├─ start: Date            firstOccurrenceFrom(start, recurrence, from)
 ├─ end?:  Date                       │
 └─ recurrence? {freq,                ├── getUpcomingEvents → homepage, /agenda,
      interval, until}                │      table view, venue + organiser pages
                                      ├── event page (which date to show)
                                      └── ical-import (roll a past start forward,
                                             skip entries whose series has ended)
```

Two functions in `recurrence.ts` decide, for every surface, which dates an event
has. Everything else consumes their output. That is what makes this change
tractable and also what makes it risky: a mistake there is visible everywhere at
once.

Constraints that already bit us and still apply:
- `parseAll` **skips** a document that fails validation, so a field that becomes
  required would silently remove existing events from the site and the backend.
- `updateDocument` merges a form patch over stored frontmatter. A field the form
  does not send must survive; `docs/bugs/recurrence-edit-clobber.md` records a
  save that silently rewrote a series because of this.
- Dates are wall time in Europe/Amsterdam: forms write ISO `Z`
  (`siteInputToIso`), offset-less stored values are read as UTC
  (`parseStoredDateTime`). See `docs/bugs/event-times-read-in-server-timezone.md`.

## Goals / Non-Goals

**Goals:**
- One event, several irregular dates, each listed as its own occurrence.
- One page and one URL for the series, with a way to link a single date.
- Existing events behave exactly as before.

**Non-Goals:**
- `RDATE` from calendar feeds (the follow-up this unlocks).
- A different end time per date.
- Multi-date public submissions.

## Decisions

### D1. `dates: Date[]` alongside `start`, optional

`start` stays the anchor: the first occurrence, the ordering key, and what every
existing document already has. `dates` holds the *further* dates.

*Why not one `dates` array replacing `start`:* it would make a required field
change shape, and a migration that misses a file makes that event vanish rather
than fail loudly — `parseAll` skips invalid documents. The same reasoning kept
`feedId` and `socials` optional.

Normalisation on write: parse each value as site time, drop anything unparseable,
drop duplicates and any date equal to `start`, sort ascending, cap at
**24 dates** (a season's worth; a hand-crafted POST cannot store thousands).

*Consequence:* `start` is not special to a reader. The page and the listings talk
about "dates"; the model just keeps the first one in its own field.

### D2. Mutually exclusive with `recurrence`

An event repeats on a rule, or it names its dates. Enforced at the form layer
(the schema stays permissive, so an odd stored document keeps rendering), and the
expansion prefers `recurrence` if both are somehow present, so behaviour is
defined rather than merged.

*Why:* merging a rule with a list means explaining the interaction in the form,
deduping across two generators, and answering "does the rule's end date bound the
listed dates too?". None of that earns its keep for a neighbourhood agenda.

### D3. The two functions take the dates, and stay pure

```
 occurrencesInRange(start, recurrence, from, horizon, dates?) → Date[]
 firstOccurrenceFrom(start, recurrence, from, dates?)         → Date | null
```

`dates` merges with `start`, filtered to the range, sorted, deduped. With
`recurrence` present, `dates` is ignored (D2). Both stay pure and clock-injected,
so the existing tests extend rather than change shape.

*Trade-off:* an extra positional parameter on two widely called functions. An
options object would read better but touches every call site; the parameter is
optional, so existing calls are untouched.

### D4. Each occurrence carries its own end

The duration is `end − start` applied to the occurrence. `EventOccurrence`
already carries `{event, start}`; it gains an optional `end` so the table view,
the page and the structured data all read the same value instead of recomputing
it.

This fixes an existing defect: `eventJsonLd` currently emits `endDate: event.end`
whatever occurrence is shown, so a recurring event's structured data pairs a late
start with the first occurrence's end.

### D5. `?datum=YYYY-MM-DD` selects a date; canonical stays bare

The page shows the next date at or after today; `?datum=` overrides it with a
date the event actually has. An unknown or malformed value falls back to the
default, so a bad link is never an error. `alternates.canonical` stays the plain
path, so the dated variants do not compete in search results. Listing rows link
to their own date, so clicking "8 nov" in the agenda opens the 8 November night.

### D6. The page presents the series

Under the date badge: the other dates, with past ones muted and marked. When all
dates have passed the page presents the last one — otherwise a visitor arriving
in December at a series that ran in October sees its first night as though it
were the story.

### D7. The admin forms get a date list; the public form does not

A client component renders rows of `datetime-local` inputs with add and remove,
posting `dates[]`. Without JavaScript the rows already present still submit, so
an editor can always edit existing dates; adding one needs the button.

The public submission form stays single-date: accepting 24 dates from anonymous
submissions is a moderation problem, not a feature.

Server-side, `dates` is read and normalised only by the paths that present it.
Approval, hiding, permalink changes and import adoption all patch frontmatter
without mentioning it, so it survives (D1's clobber note).

## Risks / Trade-offs

- **[`occurrencesInRange` is load-bearing]** Homepage, agenda, table view,
  venue/organiser pages, and the importer's roll-forward all depend on it. → The
  parameter is optional and ignored when absent, so an event without dates takes
  exactly today's path; tests cover both.
- **[Timezone regression in a new field]** Each date must go through
  `parseStoredDateTime` on read and `siteInputToIso` on write, or we reintroduce
  the bug fixed on 17 September. → Tests assert a listed date renders at its
  Amsterdam wall time under `TZ=UTC`.
- **[Clobbering the list]** A save from the queue, the import, or a future form
  that omits `dates` must not drop them. → Covered by a test over the merge, as
  `mergeDocument` is already tested for `uid` and socials.
- **[First client-side admin form]** Every other backend form is plain server
  HTML. Keyboard and screen-reader behaviour of the add/remove rows falls under
  the accessibility spec. → Budget a browser pass for it.
- **[Series with many dates crowd a listing]** A 24-date series contributes 24
  rows to the agenda. → The agenda already loads 12 at a time; acceptable, and
  visible to the editor when they add the dates.

## Migration Plan

No data migration: `dates` is optional and absent from every existing document.
Deploy, then add the second and third date to one real series in the backend and
check the agenda lists each one, the page shows the series, and a dated link
opens the right night. Rollback is a revert; documents that already carry `dates`
keep validating afterwards, they just stop expanding.

## Open Questions

None blocking. `RDATE` import is the intended follow-up.
