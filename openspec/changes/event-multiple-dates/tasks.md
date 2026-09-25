## 1. Model and expansion (D1, D2, D3, D4)

- [x] 1.1 Add the optional `dates` list to the event schema, parsed as site time
      like `start`/`end`, and carry it through to the resolved event model.
- [x] 1.2 Add a pure normaliser: parse, drop unreadable values, drop duplicates
      and any date equal to `start`, sort ascending, cap at 24. Unit-test it,
      including under `TZ=UTC`.
- [x] 1.3 Extend `occurrencesInRange` and `firstOccurrenceFrom` with the optional
      dates, ignored when a recurrence is present. Extend
      `recurrence.test.ts`: dates inside and outside the range, ordering among
      recurrence output, a date equal to `start`, all dates past, and an event
      with no dates behaving exactly as today.
- [x] 1.4 Give `EventOccurrence` its own `end`, derived from the event's
      duration, and use it in the table view and the event page.

## 2. Public surfaces (D4, D5, D6)

- [x] 2.1 Event page: present the next date at or after today, or the last date
      when all have passed; list the other dates with past ones muted and marked.
- [x] 2.2 Support `?datum=YYYY-MM-DD`: present that date when the event has it,
      fall back to the default otherwise, and keep the canonical URL bare.
- [x] 2.3 Link each listing row (cards and table) to its own date.
- [x] 2.4 Structured data: emit the presented occurrence's start and its own end.
      Add a test that a later occurrence does not report the first one's end.

## 3. Backend forms (D7)

- [x] 3.1 Add the date-list control to the admin create and edit event forms: rows
      of date/time inputs with add and remove, posting the list; rows already
      present submit without JavaScript.
- [x] 3.2 Read and normalise the list on save, refuse a save carrying both a
      recurrence and dates, and report why. Leave the public submission form
      single-date.
- [x] 3.3 Test that the list survives a save from a path that does not present it
      (queue approval, import adoption, permalink change), in the style of the
      existing `mergeDocument` tests.

## 4. Verify

- [x] 4.1 Run `pnpm test`, `pnpm typecheck`, and `pnpm lint`; run the suite under
      `TZ=UTC` as well.
- [x] 4.2 Check in a browser against the running app, with a three-date series:
      - The agenda and homepage list each future date, in date order among other
        events.
      - Clicking a row opens the page on that date.
      - The page shows the next date, lists the others, and marks past ones.
      - A dated link opens that date; an unknown date falls back; the canonical
        URL stays bare.
      - Structured data on the page matches the date shown, start and end.
      - The admin form adds, removes and reorders dates; recurrence plus dates is
        refused; the date rows are keyboard operable.
      - An event without extra dates renders exactly as before.
- [x] 4.3 Check a series whose dates have all passed: the page shows the last
      date, and no listing shows it.
