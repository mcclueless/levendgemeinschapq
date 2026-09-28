## 1. Time range (D1)

- [x] 1.1 Move the table view's time-range rule into `formatTimeRange(start, end?)`
      in `lib/date`. Test it under `TZ=UTC` too: a same-evening range, no end,
      a zero duration, a duration of a day or more, and a range across the
      change to winter time.
- [x] 1.2 Use the helper in the table view, which should render exactly as before.

## 2. Event page (D2)

- [x] 2.1 Show the presented occurrence's time range in the date badge.
- [x] 2.2 Show each other date's time range in the "Ook op" list.
- [x] 2.3 Check that an event without an end renders its start alone, as today.

## 3. Admin preview (D3)

- [x] 3.1 Show "tot HH:MM" under each date row, derived from that row's start and
      the form's start and end, formatted in Amsterdam time.
- [x] 3.2 Update the preview as the event's start, the event's end, or the row
      changes. Show nothing when it cannot be derived.
- [x] 3.3 Associate each preview with its row's input for assistive technology,
      without a live region.

## 4. Verify

- [x] 4.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`, and run the suite
      under `TZ=UTC` as well.
- [x] 4.2 Check against the running app with a three-date series:
      - The page badge and the "Ook op" list show each date's range.
      - The ranges match the table view.
      - The admin preview matches what the table shows after saving, and follows
        edits to the event's start and end.
      - An event without an end looks exactly as before.
      - The badge wraps cleanly at phone width.
- [ ] 4.3 After deploy, check that Stilteviering's page shows 19:30–20:30 on each
      of its dates.
