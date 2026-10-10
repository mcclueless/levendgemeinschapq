# Tasks

## 1. The date an event is listed by (D1)

- [x] 1.1 Add a pure `eventListDate(summary, today)` to `list-query.ts` on
      `presentOccurrence`, and use it for the `datum` sort and the default
      order of events. Test a weekly event started months ago sorting by its
      next occurrence, an event whose further date is still to come, a past
      event keeping its date, and that blog posts and projects are unchanged.

## 2. The Datum cell (D2)

- [x] 2.1 Pass `today` from the list page to `ContentTable` and show
      `eventListDate` in the Datum cell, keeping the recurrence label, the
      further-dates count and the marker badge.

## 3. Verify

- [x] 3.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. In the app, with
      a weekly event started months ago and an event with a future extra
      date, check the order and the Datum cell in both directions. Restore
      any content files the checks changed.
