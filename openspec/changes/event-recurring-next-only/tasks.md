## 1. Model (D1, D2)

- [ ] 1.1 Add optional `nextOccurrenceOnly?: boolean` to the event schema in
      `src/content/schema.ts`; carry it through `types.ts`, `repository.ts` and
      `summaries.ts`. Test that an event without the field parses, and that a
      flag without a recurrence rule is ignored by `showsNextOnly`.
- [ ] 1.2 Add `src/content/event-series.ts` with `showsNextOnly(event)`,
      `occurrencePassedAt(event, start)`, and `listedOccurrences(event, from,
      horizon, now)`. Unit-test all three: selection returns the first
      occurrence still underway, returns the empty list once a `recurrence.until`
      series is fully past, and is a no-op for every event that does not
      collapse. Keep `occurrencesInRange` in `recurrence.ts` unchanged.
- [ ] 1.3 In `src/content/events.ts` (`getUpcomingEvents`), call
      `listedOccurrences` instead of `occurrencesInRange`. Test that a
      collapsing weekly event contributes one entry to the list and that an
      ordinary recurring event still contributes all its occurrences.

## 2. Selection labels (D4)

- [ ] 2.1 Add `formatWeekdayShort` and `formatDayMonth` to `src/lib/date.ts`,
      beside the existing date formatters. Unit-test both with known dates in
      the Amsterdam timezone.
- [ ] 2.2 Add `recurrenceSummary(recurrence, next)` and `nextDateLabel(next)` to
      `src/lib/recurrence-label.ts`. Test weekly (every week, every two weeks),
      monthly, and that the interval word is kept ("Elke 2 weken vr. om 16:30").

## 3. Listings (D5, D6)

- [ ] 3.1 In `src/components/events/event-card.tsx` (`EventCard`): for a
      collapsing occurrence, replace the single `Badge tone="accent"` line with
      two stacked lines — rhythm text and "Volgende <date>". The `<time
      dateTime>` attribute keeps the ISO date. Add the `aria-hidden` "⟳" glyph
      and the CSS ring on the badge. Test the rendered output for a collapsing
      and a non-collapsing occurrence.
- [ ] 3.2 In `event-card.tsx` (`EventRow`): show "Volgende <date>" in the
      fixed-width time column, with the rhythm below as muted text. Keep the
      existing time rendering for non-collapsing occurrences. Test the rendered
      output.
- [ ] 3.3 In `src/components/events/event-table.tsx` (`EventTable`): for a
      collapsing occurrence, put "Volgende <date>" in Datum and the rhythm with
      weekday in the Herhaling column (which already prints `recurrenceLabel`).
      Test the rendered output.
- [ ] 3.4 Add the badge ring rule and the `[data-recurrence-only]` hide rule to
      `src/app/globals.css`. Keep contrast unchanged. Verify the ring renders in
      a browser.

## 4. Form (D7, D8)

- [ ] 4.1 Add `CheckboxField name="nextOnly"` to the recurrence grid in the
      create and edit event forms. Label: "Toon in de agenda alleen de volgende
      keer". Add the CSS rule that hides `[data-recurrence-only]` controls when
      `recurrence` is set to `none`. Mark the checkbox `data-recurrence-only`.
- [ ] 4.2 In the create and update actions in
      `src/app/beheer/actions.ts`, read `nextOnly` and write `nextOccurrenceOnly`
      only after a recurrence rule is confirmed; drop it silently otherwise. The
      edit form prefills from the stored flag. Test the action reads and writes
      correctly, and that a flag arriving without a rule is dropped.

## 5. Tests and verify

- [ ] 5.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`, also under
      `TZ=UTC`. All pass.
- [ ] 5.2 In the app with temporary content: a collapsing weekly event appears
      once in the agenda, the homepage and an organiser's listing; the date box
      shows the two lines; the table shows "Volgende" in Datum and the rhythm in
      Herhaling; after the occurrence's hour the next one takes its place; the
      event's own page is untouched and all `?datum=` links work; existing
      recurring events are unchanged. Remove the temporary content.
- [ ] 5.3 After deploy, tick the flag on one weekly event on goeddoen.net, check
      all three listing views and the event page, watch the rollover at the
      occurrence's end, then untick.
