## 1. The note helper (D2, D3)

- [x] 1.1 Add `previewDateEndNote` to `src/content/event-dates.ts`: the
      "fill in start and end" note when the row is filled and readable with a
      time part but the event's start or end is not; `undefined` otherwise.
      Tests in `src/content/event-dates.test.ts` cover: start missing, end
      missing, both present (no note), row empty (no note), row unreadable
      (no note), a date-only row (no note).

## 2. The row (D1, D2)

- [x] 2.1 In `src/components/admin/date-list-field.tsx`, move the end beside
      the input at `text-base text-ink`, show the note in its place when the
      helper returns one, and keep `aria-describedby` pointing at whichever is
      shown. Verify with `pnpm typecheck` and `pnpm lint`.

## 3. Verify

- [x] 3.1 Run `pnpm test`, also under `TZ=UTC`. All pass.
- [ ] 3.2 In the running backend event form: with start and end filled, a
      further date shows "tot 22:00" beside it at the date's size; clearing
      the end replaces it with the note; a row with no date shows nothing;
      marker mode shows nothing; at phone width the row wraps without
      horizontal scroll.
- [ ] 3.3 After deploy, open an event with extra dates on goeddoen.net's
      backend and check the end reads beside each date.
