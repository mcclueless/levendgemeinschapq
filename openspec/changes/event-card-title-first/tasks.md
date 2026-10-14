## 1. The cards (D1, D2)

- [x] 1.1 In `src/components/events/event-card.tsx`, reorder `EventCard`'s
      body to title, venue, date box, and `MarkerCard` to title, date box,
      moving the margins with the elements. Verify with `pnpm typecheck` and
      `pnpm lint`; `pnpm test` still passes.

## 2. Verify

- [ ] 2.1 In the running app, the agenda card view and the homepage show the
      title first, the venue under it and the yellow box last, for an
      ordinary event, a collapsed recurring event, an external event (mark on
      the title) and a marker; the text view and the table are unchanged.
- [ ] 2.2 After deploy, check the agenda on goeddoen.net in the card view.
