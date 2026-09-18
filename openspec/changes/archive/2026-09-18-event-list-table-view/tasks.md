## 1. Listing URL state (D1, D3)

- [x] 1.1 Add `src/lib/listing-view.ts`. It parses `weergave` and `aantal` into a
      view and a count, falling back to cards and the page's initial count and
      clamping to 1–500. It builds hrefs that leave out default values and end in
      `#evenementen`.
- [x] 1.2 Unit-test parsing (valid values, an unknown view, zero, negative,
      fractional, non-numeric, and array values) and href building (defaults left
      out, parameter order stable, fragment present).

## 2. Table variant and controls (D5, D6)

- [x] 2.1 Add the table variant: a real table with a caption and column headers,
      explicit roles, the six columns, and an end time derived from the event's
      duration. On phones, rows stack into blocks with inline labels.
- [x] 2.2 Wire `variant="table"` into `EventList`.
- [x] 2.3 Add the listing controls: a view switch (a labelled group whose active
      link carries `aria-current`), a "Meer laden" link shown only while more
      exist, and a status line "N van M evenementen getoond". All links use
      `scroll={false}`.

## 3. Pages (D4, D7)

- [x] 3.1 Give `UpcomingEvents` an optional `switchable` mode. The homepage reads
      its search parameters, starts at 6 with a batch of 6, and looks 90 days
      ahead. Venue and organiser pages stay unchanged.
- [x] 3.2 `/agenda` reads its search parameters, starts at 12 with a batch of 12,
      and renders the controls; the intro still states the total.
- [x] 3.3 Run `pnpm test`, `pnpm typecheck`, and `pnpm lint`.
- [x] 3.4 Run the app locally and check, on the homepage and `/agenda`:
      - Cards are the default.
      - Switching to the table keeps the count, and "Meer laden" keeps the view and
        grows the list.
      - The controls work with JavaScript disabled.
      - Invalid parameters fall back to the defaults.
      - At 375px the table stacks with no horizontal scroll.
      - A location page shows no controls.
