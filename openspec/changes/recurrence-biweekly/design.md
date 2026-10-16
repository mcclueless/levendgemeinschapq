## Context

See proposal.md for the motivation. What exists:

- `RecurrenceSchema` stores `freq` (weekly | monthly), `interval` (positive
  integer, default 1) and an optional `until`. `recurrence.ts` expands by
  `interval`; `recurrence-label.ts` renders "Elke week", "Elke 2 weken",
  "Elke maand"; the iCal import writes `interval` from the feed's rule.
- `recurrence-form.ts` parses the forms: the select posts a *frequency*
  (`none`, `weekly`, `monthly`), the surface passes the frequencies it
  allows (`ADMIN_FREQUENCIES`, `PUBLIC_FREQUENCIES`), and a new recurrence
  always gets interval 1. On edit the stored interval is passed in and
  carried through blind, because the form cannot show it; this was added
  after an imported biweekly event was flattened to weekly by a title edit
  (`docs/bugs/recurrence-edit-clobber.md`).
- Three forms render the select by hand: the backend create form, the
  backend edit form (prefilled from `d.recurrence?.freq`) and the public
  submission form (weekly only).
- The module has no test file of its own.

## Goals / Non-Goals

**Goals:**
- An editor can choose every two weeks on the backend forms.
- The edit form never lies about the stored rhythm, and a save never
  changes a rhythm the editor did not touch.
- The public form's behaviour is unchanged.

**Non-Goals:**
- Arbitrary intervals, "twice a week", or specific weekdays.
- Any change to the stored model, the expansion, the labels or the import.
- Offering every two weeks on the public form (one line later, if wanted).

## Decisions

### D1. The stored model is untouched

Every two weeks is `{ freq: "weekly", interval: 2 }`, which is what the
import already writes and what every reader already renders and expands.
Nothing downstream changes, and no migration is needed.

### D2. The select posts a choice, not a frequency

`RecurrenceChoice = "weekly" | "biweekly" | "monthly"`, with a table
`CHOICES: Record<RecurrenceChoice, { freq, interval }>`. The surfaces pass
the choices they offer: `ADMIN_CHOICES = ["weekly", "biweekly", "monthly"]`,
`PUBLIC_CHOICES = ["weekly"]`. `recurrenceFromForm` maps the posted choice
through the table; an unknown or disallowed value still means "no
recurrence", as today, so a hand-crafted `biweekly` on the public form is
dropped rather than refused. The field names and the end-date rules are
unchanged.

Alternative considered: posting `freq` and `interval` as two fields. Two
controls for one idea, and a free interval field invites values no label
or listing was designed for. Rejected.

### D3. The edit form shows a stored rhythm it cannot offer, and keeps it

`choiceFor(recurrence)` returns the choice whose frequency and interval
match, or `undefined`. The edit form selects that choice; when there is
none (an imported every three weeks, every two months), it renders one
extra option with value `stored`, labelled by `recurrenceLabel` ("Elke 3
weken"), and selects it. `recurrenceFromForm` takes the stored recurrence
as its fourth argument instead of a bare interval; a posted `stored`
yields the stored frequency and interval (with the posted end date, which
remains required), and is ignored when nothing is stored, so the create
form and the public form cannot be made to post it meaningfully.

This retires the blind carry-through. The clobber bug stays fixed, by a
different mechanism: the untouched select posts `stored`, so the save
keeps the rhythm; and the editor can see what it is. It also changes one
behaviour on purpose: choosing Wekelijks on a biweekly event now means
weekly, where today the stored 2 would survive the choice.

### D4. One select component for the backend forms

A small server component, `RecurrenceSelect({ choices, stored? })` in
`src/components/admin/`, renders the `none` option, the offered choices
and the stored-only option, with `defaultValue` worked out from `stored`.
Both backend forms use it, so they cannot drift. The public form keeps its
own two-option select; it posts `weekly`, which is still a valid choice.

### D5. Wording

The option is "Elke 2 weken", the exact phrase `recurrenceLabel` produces,
so what the editor picks reads the same as what the event page and the
queue will say. "Tweewekelijks" is avoided: in Dutch it also means twice a
week. Wekelijks and Maandelijks stay as they are.

## Risks / Trade-offs

- [An event that repeats every two weeks and whose stored `interval` is
  missing] → `interval` defaults to 1 in the schema, so such an event is
  weekly today and stays weekly; nothing to handle.
- [An editor opens an imported every-three-weeks event, sees "Elke 3
  weken" and wonders why it is not in the list] → the option is selected
  and legible; choosing another choice replaces it, which is the intended
  way out.
- [The public form posts `weekly` under the new type] → covered by a test
  that the public choice list still yields interval 1 and drops `biweekly`.
