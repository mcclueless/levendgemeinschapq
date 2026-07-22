## Context

The recurrence stack is already complete on the read side and empty on the write
side:

```
            WRITE                                READ
  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │ admin form               │        │ occurrencesInRange()         │
  │   Herhaling: freq only   │──┐     │   honours `until` ✔          │
  ├──────────────────────────┤  │     │ nextOccurrence()             │
  │ public form              │  ├────▶│   honours `until` ✔          │
  │   (no recurrence at all) │  │     │ RecurrenceSchema             │
  ├──────────────────────────┤  │     │   until: z.coerce.date()     │
  │ iCal import              │──┘     │          .optional()    ✔    │
  │   freq + interval + until│        └──────────────────────────────┘
  └──────────────────────────┘
```

`recurrenceFrom()` in `src/app/beheer/actions.ts` is the whole write side for the
admin path:

```js
function recurrenceFrom(form: FormData) {
  const freq = str(form, "recurrence");
  if (freq === "weekly" || freq === "monthly") return { freq, interval: 1 };
  return undefined;
}
```

So this change is almost entirely *form plumbing*. Nothing in the domain model,
the parser, or the expansion logic needs to move.

## Goals / Non-Goals

**Goals:**

- Make the already-specified "Ending recurrence" behaviour reachable from both
  authoring paths, and make it the only way to author a recurrence.
- Give public submitters recurrence, scoped narrower than the backend, without
  weakening the approval gate.
- Zero migration: existing documents stay valid and behave identically until
  someone edits them.

**Non-Goals:**

- Editable `interval` (stays `1`).
- Monthly recurrence on the public form.
- Fixing the `updateEvent` wholesale-replacement defect (separate bug report).
- Any change to `schema.ts` or `recurrence.ts`.

## Decisions

### D1 — Reuse `recurrence.until`; do not add a new frontmatter field

`RecurrenceSchema.until` already exists, is optional, and is already read by both
expansion functions. Adding a sibling field would mean two sources of truth and a
migration. Storing into `until` means an event authored through the new form and
an event imported from an iCal `RRULE;UNTIL=` are indistinguishable downstream —
which is the correct outcome.

### D2 — "Required" is enforced at the form layer, **not** in the schema

This is the load-bearing decision of the change, and it is easy to get wrong.

The natural reading of "end date is required once frequency is set" is to make
`until` non-optional in `RecurrenceSchema`. That would be a mistake:

```
  RecurrenceSchema.until: required
            │
            ├──▶ content/events/repair-cafe.mdx  (freq: weekly, no until)
            │      → parseDoc throws
            │      → parseAll CATCHES and SKIPS it  (parse.ts:53)
            │      → the event silently disappears from the site
            │
            └──▶ iCal RRULE without UNTIL  (legal; mapRecurrence → until: undefined)
                   → every import of an open-ended series fails validation
```

`parseAll` logs and skips invalid documents rather than surfacing them, so a
tightened schema would quietly delete content from the public site. So:

| Layer | `until` when a frequency is set |
|---|---|
| `RecurrenceSchema` (`schema.ts`) | stays `.optional()` — **unchanged** |
| Admin create/edit actions | **required** — reject the save |
| Public submit action | **required** — reject the submission |
| iCal import | not required — imports open-ended series as today |

The invariant is therefore *"no newly authored open-ended recurrence"*, not
*"no open-ended recurrence exists"*. Both spec deltas are written to say exactly
that, so a reviewer does not later "fix" the schema to match the requirement.

### D3 — Field name `recurrenceUntil`, not `end`

The event already has an `end` field. These are different things and users will
conflate them:

```
  start: 2026-09-03 19:00 ┐
  end:   2026-09-03 21:00 ┘  bounds ONE occurrence (an evening)

  recurrence:
    freq: weekly
    until: 2026-12-31       bounds the SERIES (the last week it repeats)
```

Decisions that follow:

- The form field is named `recurrenceUntil` so it cannot collide with `end` in
  `FormData`.
- Its label is *"Herhalen tot en met"* with a hint distinguishing it from
  *"Einde"*, and it is rendered **inside** the recurrence group, directly under
  the `Herhaling` select — not next to the start/end pair.
- The name is deliberately inclusive ("tot en met"): `occurrencesInRange` breaks
  on `occ > end`, so an occurrence falling exactly on `until` is included.

### D4 — Input type `date`, not `datetime-local`

`until` is a cut-off day, not a moment. A `date` input yields `"2026-12-31"`,
which `z.coerce.date()` parses to midnight UTC on that day. Because the
comparison is `occ > end`, an occurrence later in the day on the final date would
be excluded by a midnight cut-off.

To keep *"tot en met"* honest, the action normalises the parsed date to the
**end** of that day before storing it. This is the one piece of genuine logic in
the change and belongs in a small shared helper rather than being duplicated
across the two actions.

### D5 — Validation outcomes

Two distinct failures, reported distinguishably rather than as one generic error:

| Condition | Outcome |
|---|---|
| frequency set, `recurrenceUntil` empty | reject — "kies een einddatum voor de herhaling" |
| frequency set, `until` earlier than `start` | reject — "einddatum ligt vóór de startdatum" |
| frequency `none`, `recurrenceUntil` set | **accept**, discard the stray value (D6) |
| frequency `none`, `recurrenceUntil` empty | accept, no recurrence |

Redirect targets:

| Path | On invalid recurrence |
|---|---|
| admin create | `redirect("/beheer/nieuw/evenement?error=recurrence")` |
| admin edit | `redirect("<edit path>?error=recurrence")` |
| public submit | `redirect("/evenement-indienen?error=recurrence")` |

The public form **already renders** an error banner off `params.error`, so it
only needs a second message branch. The admin forms currently redirect with
`?error=1` and render nothing at all — a pre-existing gap. This change makes the
admin event forms read `searchParams` and render both messages; the other admin
forms are left alone.

Client-side `required` on the input is **not** sufficient on its own — the field
is only conditionally required, and the public form is a server-action form that
must validate server-side regardless. Client `required` may be toggled as a
progressive enhancement, but the server check is the contract.

### D6 — `until` is ignored unless a frequency is chosen

`recurrenceFrom()` returns `undefined` when `Herhaling` is *Eenmalig*. A stray
`recurrenceUntil` value in that case (user picked a date, then switched back to
*Eenmalig*) is discarded, not persisted as an orphan, and does not trigger the
required-field error.

### D7 — Public form offers non-repeating or weekly only

Monthly stays administrator-only. Rationale: weekly covers the recurring
neighbourhood activity that submitters actually run (repair café, garden
session, weekly borrel), while a monthly series commits a longer stretch of the
agenda from a single unreviewed submission. An administrator can widen a
submission to monthly on approval, so nothing is permanently lost.

The narrowing is enforced **server-side**, not just by omitting the option from
the select — `submitEvent` accepts `weekly` and rejects `monthly` if it arrives,
since a hand-crafted POST can send anything. Treat an unexpected value as
non-repeating rather than erroring; there is no legitimate UI path that produces
it.

### D8 — Public and admin share the parsing rule, not the code

`src/app/evenement-indienen/actions.ts` deliberately keeps its own local `str()`
helper rather than importing from the admin actions module — the admin module is
`"use server"` with `assertAdmin` throughout, and importing across that boundary
would drag admin concerns into a public route. The recurrence helper follows the
same precedent: it lives in a neutral module (alongside the existing recurrence
code) and is imported by both actions, so the two paths cannot drift on the
end-of-day normalisation or the validation rules. The **allowed frequency set is
a parameter** of that helper, which is how D7's narrowing is expressed without
forking the logic.

### D9 — Public submissions gain recurrence but not privilege

The submitted document still gets `status: "pending"`, `submittedBy`, and
`submittedAt` exactly as now. The only new key is `recurrence`. Nothing about the
approval gate changes.

The reviewer-facing consequence is that `PendingEvent.recurrence` in
`src/content/admin.ts` is currently typed `"weekly" | "monthly"` — it flattens to
the frequency and drops everything else. Since a submitter can now propose "every
week until December", the queue must show that, so the field widens to carry the
end date alongside the frequency.

## Risks / Trade-offs

- **Editing an existing open-ended event now forces an end date.** The largest
  behavioural consequence of D2 + "required". `content/events/repair-cafe.mdx`
  repeats weekly with no `until`; it renders fine forever, but the first
  administrator to touch it must decide when the repair café stops. That is
  arguably the point of the change, but it is a real editorial burden appearing
  at an unrelated moment (fixing a typo in the description). An alternative —
  requiring an end date only when the recurrence is newly *set*, not when it is
  merely *retained* — is more forgiving but much harder to explain and to
  implement correctly against the clobber bug. Current decision: require it
  whenever a frequency is present on save.
- **Users conflating "Einde" with "Herhalen tot en met".** Mitigated by D3's
  grouping and labelling, but it remains the main usability risk. Worth watching
  in the first real submissions.
- **A submitter who genuinely does not know when the series ends** must guess.
  The mitigation is that the end date is editable afterwards, and an
  administrator sees it in the queue before approval.
- **Interaction with the separate clobber bug.** Adding an `until` input to the
  edit form means `recurrenceFrom` will now round-trip `until` correctly, so the
  bug report's `until` symptom disappears once this ships. `interval` is still
  destroyed on every admin edit of an imported event. Whichever change lands
  second should re-verify against the other, since both touch `recurrenceFrom`.

## Resolved Questions

- *Should the end date be required once a frequency is chosen?* **Yes** —
  required at the form layer on both paths, schema unchanged (D2, D5).
- *Should the public form offer the same frequencies as the backend?* **No** —
  non-repeating or weekly only, enforced server-side (D7).
