## Context

Every listing draws its occurrences from one function: `getUpcomingEvents` in
`src/content/events.ts`. It walks published events and, for each, calls
`occurrencesInRange(start, recurrence, from, horizon, dates)` from
`recurrence.ts`, pushing one `EventOccurrence` per date, then sorts the lot by
start. `from` is `startOfToday()`; the agenda's horizon is 90 days, the default
365. The agenda, the homepage, and the listings on venue, organiser, project
and blog pages all go through it, so a change there reaches all of them and
nothing else.

The event *page* does not go through it. `event-presentation.ts`
(`presentOccurrence`) expands the series itself to pick the occurrence to show
and to honour `?datum=`, and `ical-import.ts` uses `firstOccurrenceFrom` to
decide whether an imported entry is still current. Leaving `recurrence.ts`
alone therefore leaves the page, its share metadata, its structured data and
the importer alone.

Listings are rendered by three components: `EventCard` and `EventRow` in
`event-card.tsx`, and `EventTable`. The card shows `formatWhen(start)` —
"vr 16 okt · 16:30" — inside a yellow `Badge tone="accent"`. The row shows the
same string in a fixed-width `<time>`. The table has a Datum column, a Tijd
column, and a **Herhaling column that already prints `recurrenceLabel`** ("Elke
week").

`src/lib/recurrence-label.ts` is the single vocabulary for describing a
recurrence (share-event-previews D4): it exists because two surfaces once
worded the same rule differently and both ignored `interval`. Anything that
names a recurrence goes through it.

An event either repeats on a rule or names its dates, never both
(event-multiple-dates D2), enforced at the form layer. A recurring event may
also be an agenda marker (event-no-page) or lead to an external page
(event-external-link).

## Goals / Non-Goals

**Goals:** one agenda entry for a weekly or monthly series, always at its next
date, honest about the rhythm; opt-in, so nothing stored changes; the event page
untouched.

**Non-Goals:** collapsing a date series; a "next N" variant; the public
submission form; the importer setting the flag; changing the agenda's horizon.

## Decisions

### D1. One optional boolean, paired with the rule at the form layer

The stored event gains `nextOccurrenceOnly?: boolean`. Absent means off, so
every stored event keeps its behaviour with no migration.

The flag only means anything together with a `recurrence`. That pairing is
enforced **at the form layer, and the reader ignores an unpaired flag** — the
schema stays a plain `z.boolean().optional()` with no cross-field rule.

*Why not validate the pairing in the schema:* `parseAll` skips a document that
fails validation, which removes the event from the public site *and* the backend
list at once, with no UI path back to it. The project has refused cross-field
schema rules for exactly this reason three times — `dates` versus `recurrence`
(event-multiple-dates D2), an `end` before its `start`
(docs/bugs/event-end-before-start-unvalidated.md, kept form-only because two
stored events would have vanished), and `recurrence.until` staying optional
(add-recurrence-end-date D2). A `superRefine` here would mean one hand-edited
file, or one future code path that writes the flag before the rule, silently
deleting an event. The form refuses the combination, the reader defines it
away, and a strange file still renders.

So `showsNextOnly(event)` is `Boolean(event.nextOccurrenceOnly &&
event.recurrence)`: a flag without a rule is dead, not dangerous, and an event
carrying both the flag and `dates` is unaffected, because without a recurrence
the flag does nothing.

*Why this name:* stored content fields here are declarative about the content
(`noPage`, `externalUrl`, `moreOrganisers`), not imperative about the UI, so
`nextOccurrenceOnly` is preferred over `showNextOccurrenceOnly`. Same meaning,
reads better beside `noPage` at the call sites.

### D2. The selection happens once, in `getUpcomingEvents`

A new pure module `src/content/event-series.ts` holds three functions:

- `showsNextOnly(event)` — the derived predicate of D1. Derived, not a new
  field on `EventOccurrence`: the three components already read the event off
  the occurrence, and a second source of truth could disagree with the
  selection that produced it.
- `occurrencePassedAt(event, start)` — when one occurrence stops being current
  (D3).
- `listedOccurrences(event, from, horizon, now)` — the dates a listing gets:
  for a collapsing event, the first occurrence in range whose `passedAt` is
  after `now`, as a one-element list or an empty one; for every other event,
  exactly what `occurrencesInRange` returns today.

`getUpcomingEvents` calls `listedOccurrences` instead of `occurrencesInRange`,
and nothing else changes: the collapse happens before the sort, so the single
entry sorts into the agenda at its next date rather than being pinned anywhere,
and `total`/`hasMore` count entries as shown.

`recurrence.ts` keeps its current shape and `occurrencesInRange` stays the full
expansion. That is what leaves the event page, `?datum=` links, share metadata,
structured data and the importer untouched — requirement 6 costs nothing
because the page never used this path.

*Why not `firstOccurrenceFrom(start, recurrence, now)`:* it is not end-aware. At
17:00 it would skip a 16:30–18:00 occurrence that is still underway and show
next week's. The selection walks `occurrencesInRange` from `startOfToday()` and
takes the first whose `passedAt` is after `now`, which keeps an occurrence
in progress.

`now` is injected, like `today` into `presentOccurrence` and `now` into
`startOfToday`, so the selection is testable without touching the clock. The
listing pages are already `force-dynamic`, so a per-request clock introduces no
caching question.

### D3. An occurrence is over at its end, or at its start when it has none

`occurrencePassedAt(event, start)` is:

| The occurrence | Passed at |
|---|---|
| has an end (`occurrenceEnd`) | that end |
| is an agenda marker (`noPage`) | the end of its day |
| otherwise | its own start |

The requester asked for the next occurrence to appear "once the hour has
passed", so an untimed 16:30 event rolls over at 16:30. An event given an end
time stays until it is genuinely over, which is the better entry and which the
form already offers.

A marker is about a day, not a time (event-no-page D3) — its start is 00:00, so
rolling over at its start would make a recurring marker vanish at midnight and
never appear on its own day. The end of its day keeps the existing rule intact.

**The consequence, stated plainly:** a collapsing entry leaves "today" when its
occurrence is over, while every ordinary listing entry lingers until midnight,
because `from` is `startOfToday()` and that is not changing. So at 17:00 on
Friday the agenda shows "Volgende 23 okt" for the lessons, while an ordinary
one-off event at 16:30 that same Friday is still listed.

*Why not end-of-day for everything:* it is more consistent with ordinary
entries, but it fails the requirement for exactly the events that prompted the
change — weekly lessons and services, typically stored without an end time —
which would keep pointing at this afternoon until midnight.

### D4. Two lines, in the one recurrence vocabulary

`recurrence-label.ts` gains two functions, because that module is where
everything that describes a recurrence has to live:

- `recurrenceSummary(recurrence, next)` — "Elke week vr. om 16:30". It builds on
  `recurrenceLabel`, so the interval is never lost: every second week reads
  "Elke 2 weken vr. om 16:30", which the events spec already demands of every
  description. Monthly reads "Elke maand om 16:30" and leaves the day of the
  month to the next line, which states it exactly.
- `nextDateLabel(next)` — "Volgende 16 okt".

`lib/date.ts` gains the two formatters they need, beside the existing ones and
built the same way: `formatWeekdayShort` ("vr") and `formatDayMonth` ("16 okt").
The next-date line drops the weekday because the rhythm line already named it.

*The time reads "16:30", not "16.30" as the request wrote it,* because
`formatTime` renders every other time on the site and one vocabulary is worth
more than the notation.

### D5. Where the lines go in each of the three listings

- **`EventCard`** — the yellow `Badge tone="accent"` holds both lines, stacked.
  Only the next date sits in `<time dateTime>`; the rhythm line is plain text,
  so the machine-readable date stays one date.
- **`EventRow`** — the fixed-width `<time>` column shows "Volgende 16 okt" and
  the rhythm follows as muted text, matching how the row already appends the
  venue.
- **`EventTable`** — Datum shows "Volgende 16 okt", Tijd is unchanged (the
  occurrence's own time range), and the **Herhaling column shows the rhythm with
  its weekday** ("Elke week vr."). The table says it in its own columns rather
  than repeating the whole sentence in Datum, because that column already
  prints `recurrenceLabel` for every recurring event.

A collapsing event that is also an agenda marker keeps the marker presentation
(no time, no link); one that leads to an external page keeps its plain `<a>` and
its "↗" (event-external-link D3). The flag decides *how many* entries, not what
an entry is.

### D6. The cue: the sentence first, then a glyph and a ring

The rhythm line is the cue: it is text, so it reaches everyone, including a
screen reader and a visitor who cannot distinguish the box. On top of it, a
repeat glyph "⟳" before the rhythm line, `aria-hidden` because the line beside
it already says the same thing, and a thin ring on the date box.

Nothing is conveyed by the ring alone, which is what
`accessibility-compliance` requires; the ring is a found-it-faster aid, not
information. Contrast is unchanged — the ring sits on the existing accent
background rather than recolouring it.

### D7. The form: a checkbox in the Herhaling group, hidden by CSS

The recurrence grid on the create and edit forms gains a third control under
the interval and the end date: `CheckboxField name="nextOnly"`, labelled "Toon
in de agenda alleen de volgende keer", with a hint naming what the entry will
read. The edit form prefills it from the stored flag.

It is meaningless without a rule, so it is hidden until one is chosen. Hiding
stays CSS-only, as it is for the marker and the external mode, keyed on the
selected option:

```css
form:has(select[name="recurrence"] option[value="none"]:checked) [data-recurrence-only] {
  display: none;
}
```

`option:checked` is live under `:has()` in the engines `globals.css` already
requires `:has()` for, so the checkbox appears and disappears as the select
changes with no script. **If that proves not to hold in a supported browser,
the fallback is the existing `useMarkerMode` pattern** in
`event-mode-field.tsx` — a small client component listening for the select's
`change` event — not a redesign.

Either way the **server is authoritative**: the action reads the flag only
after it has a recurrence, so a flag arriving without one is dropped silently,
with no error. That is the existing treatment of the neighbouring control — "an
end date supplied without a recurrence interval saves as non-repeating and
SHALL NOT report an error" — and it means the no-JavaScript path, where the
checkbox is always visible, cannot store a contradiction.

The flag is always in the patch the event form writes, like `noPage` and
`externalUrl`, so clearing the box removes the key. Paths that do not present
the recurrence controls — approval, import adoption, a permalink change — never
mention it, and the merge keeps it (as with `dates`, event-multiple-dates D7).

Not offered on the public submission form: a visitor submits one event, and the
agenda's shape is an editorial decision, the same reasoning that keeps the
monthly interval admin-only (add-recurrence-end-date D7). Calendar import never
sets it.

### D8. No new error, and nothing else moves

No `FORM_ERRORS` entry: the only way to get the combination wrong is to post
the flag without a rule, and that is normalised rather than refused (D7).

Unchanged, deliberately: the event page and everything derived from it
(`presentOccurrence`, share metadata, structured data); `occurrenceLink`, so
the entry still links to its occurrence's day; the sitemap, since a recurring
event has exactly one page however many times it occurs; the backend content
table, which already sorts events by their next date; the review queue; and the
Extra data path in every respect.

## Risks / Trade-offs

- **[A count that means entries]** "N activiteiten om naar uit te kijken" and
  "Meer laden" now count listing entries, so a collapsed series counts once.
  Intended — it is the same sentence being made true — but it is a visible
  change to a number on the agenda.
- **[Rollover asymmetry]** A collapsed entry leaves today when its occurrence
  is over; an ordinary entry stays until midnight (D3). Visible only to someone
  watching both on the same afternoon.
- **[An entry that flips while the event is on]** An event stored without an end
  time rolls over the moment it starts. → Give it an end time; the form already
  offers one and `occurrenceEnd` already respects it. Worth saying in the field
  hint.
- **[A visitor looking for a later date]** Only the next date is listed, so
  "is there a service on 23 October?" is not answered by the agenda alone. →
  The rhythm line states the rule and the entry links to the event's page,
  which still presents the series in full.
- **[Editors forget it exists]** Opt-in means the agenda only improves when
  someone ticks the box. → Accepted: the alternative, collapsing every
  recurrence by default, would change every stored recurring event's listing
  without anyone asking.

## Migration Plan

None. The field is absent from every stored event and absent means off, so the
agenda is byte-for-byte what it is today until an editor ticks the box. Deploy,
tick it on one weekly event, check the agenda, the homepage, its organiser's
page and all three listing views, then watch it roll over after that
occurrence's hour.
