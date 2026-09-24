## 1. Model (D1)

- [x] 1.1 Make `venue` and `organiser` optional on the event schema and `venue`
      optional on the project schema, keeping `min(1)` inside the optional so an
      empty string stays invalid.
- [x] 1.2 Follow the resolved types through `types.ts` and the repository, which
      already resolve an unknown reference to `null`.

## 2. Backend forms and actions (D2, D5)

- [x] 2.1 Event create and edit: replace the disabled placeholder with a
      selectable "Geen locatie" / "Geen organisator" option, drop `required`, and
      stop rejecting an empty selection. An unselected value must be stored as
      absent, not as an empty string.
- [x] 2.2 Project create and edit: the same for the location; leave the organisers
      multi-select requiring at least one.
- [x] 2.3 Leave the public submission form and its action untouched, both still
      requiring a Venue and an Organiser.

## 3. Review queue (D4)

- [x] 3.1 Make the queue's venue/organiser labels optional and say "Geen locatie"
      / "Geen organisator" for an absent reference, keeping "(onbekend)" for a
      slug that no longer resolves.

## 4. Verify

- [x] 4.1 Run `pnpm test`, `pnpm typecheck`, and `pnpm lint`.
- [x] 4.2 Check in a browser against the running app:
      - Save a new event with neither a location nor an organiser; it appears on
        the agenda and its page renders with no location block and no broken link.
      - Clear the location of an existing event and save; the venue page no longer
        lists it, and nothing else about the event changes.
      - Save a project with no location and one organiser; its page omits the
        location block and still shows the organiser.
      - A project with no organiser is still refused.
      - The public submission form still refuses a submission without a Venue or
        an Organiser.
      - The queue shows "Geen locatie" for an absent reference, and "(onbekend)"
        for one that no longer resolves.
- [x] 4.3 Confirm an event with no venue carries no `location` in its structured
      data and no empty block in its share card.
