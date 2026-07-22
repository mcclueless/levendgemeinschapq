# Bug: an event's end date/time is never validated against its start

- **Reported:** 2026-07-22
- **Severity:** Low today, latent — the bad data is accepted and stored, but no
  public surface renders `end`, so nothing visibly breaks yet
- **Status:** Open
- **Affects:** all three event forms (admin create, admin edit, public submission)

## Summary

Nothing checks that an event's `end` is at or after its `start`. All three forms
accept an end that precedes the start, on any path, and store it without
complaint. The stored document is schema-valid, so it parses and renders
normally — the inconsistency simply sits in the data.

Found in a real submission made through the public form:

```yaml
title: asdfasdf
start: '2026-07-25T16:42'
end:   '2026-07-24T17:44'     # the day BEFORE it starts
```

## Reproduction

1. Open any event form: `/beheer/nieuw/evenement`,
   `/beheer/evenementen/<slug>/bewerken`, or `/evenement-indienen`.
2. Set **Start** to any datetime and **Einde** to any earlier datetime.
3. Save. The save succeeds with no warning on any of the three paths.

## Cause

`src/content/schema.ts:62` validates the type but not the relationship:

```js
start: z.coerce.date(),
end: z.coerce.date().optional(),
```

There is no `.refine()` / `.superRefine()` tying the two together, and neither
`createEvent`/`updateEvent` (`src/app/beheer/actions.ts`) nor `submitEvent`
(`src/app/evenement-indienen/actions.ts`) compares them. A repo-wide search for
any such comparison finds nothing.

Note the contrast with recurrence, which *is* validated: `recurrenceFromForm`
rejects a `recurrenceUntil` earlier than `start`
(`src/content/recurrence-form.ts`, added 2026-07-22). The occurrence's own
`start`/`end` pair never got the same treatment. Anyone fixing this should
follow that precedent — validate in the shared layer, report distinguishably,
and reuse the existing `FormError` codes rather than inventing a parallel
mechanism.

## Why it is low severity today

`end` is stored but **never displayed on any public surface**. The agenda listing
and the single event page both render `formatWhen(start)` / `formatTime(when)`
and ignore `end` entirely (`src/app/agenda/[slug]/page.tsx:76`). A repo-wide
search finds no public consumer of `event.end`.

The one place it *is* rendered is the approval queue — and that rendering hides
the problem rather than exposing it:

```js
// src/app/beheer/queue/page.tsx:41
function when(start: string, end?: string): string {
  const s = new Date(start);
  const base = `${formatDateLong(s)} · ${formatTime(s)}`;
  return end ? `${base}–${formatTime(new Date(end))}` : base;
}
```

It takes the **date** from `start` and only the **time** from `end`, discarding
`end`'s date. The submission above therefore displays to a reviewing
administrator as:

```
  zaterdag 25 juli 2026 · 16:42–17:44
```

which looks like a perfectly ordinary one-hour event. An administrator has no
way to see that the end is on the previous day, so review cannot catch it.

## Why it will stop being low severity

The moment anything starts consuming `end` — an ICS export, a "duration" display,
a calendar-grid view, ordering by end time, or simply rendering the range on the
event page — the stored garbage becomes visible or produces negative durations.
The data is being accumulated now and will need cleaning then.

## Scope

| Path | Accepts end < start? |
|---|---|
| Admin event create | **Yes** |
| Admin event edit | **Yes** |
| Public submission | **Yes** |
| iCal import | Inherits whatever the feed provides; unvalidated |

## Fix directions

1. **Validate in a shared helper on write**, mirroring the recurrence precedent:
   reject with a distinguishable `?error=` code and add the message to
   `FORM_ERRORS` in `src/components/admin/form.tsx`. Smallest fix, consistent
   with what is already there.
2. **Add a schema-level `.refine()`** so the relationship is part of the content
   contract rather than a form rule. Tempting, but note the same hazard recorded
   in `openspec/changes/archive/2026-07-22-add-recurrence-end-date/` design D2:
   `parseAll` silently *skips* documents that fail validation, so tightening the
   schema would make any already-stored bad event vanish from the site and from
   the backend list with no visible error. Audit existing content first, or
   combine with a "documents that failed validation" surface.
3. **Fix the queue's `when()` to show the full end**, independently of the above.
   Even after validation lands, rendering start's date with end's time is
   misleading for any genuinely multi-day event.

(1) and (3) are small and independent. (2) needs the same care D2 called out.

## Not verified

- Whether any existing stored event already has `end` before `start`, beyond the
  one test submission that prompted this report. Worth a scan before choosing
  fix (2).
- Whether a multi-day event is a legitimate use case here (a two-day festival).
  If so, (3) is a real display bug in its own right and not merely cosmetic.
