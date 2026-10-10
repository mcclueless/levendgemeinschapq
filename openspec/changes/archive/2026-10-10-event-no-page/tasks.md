# Tasks

## 1. Data and lookup (D1, D2)

- [x] 1.1 Add `noPage: z.boolean().optional()` to the event schema and
      `noPage: boolean` to `CalendarEvent`, filled in `repository.ts` (absent →
      false). Verify with a test that an event file without the key parses as
      not a marker and one with `noPage: true` parses as a marker.
- [x] 1.2 Make `getEvent` return `null` for a marker, and leave markers out of
      `sitemap.ts`. Verify in the app that a marker's `/agenda/<slug>` is a 404
      and the sitemap has no entry for it, while an ordinary event is
      unchanged.

## 2. Saving a marker (D4, D5 server side)

- [x] 2.1 Add a pure helper that, for a marker, moves a site-time input or ISO
      date to 00:00 site time of its day. Test a typed time, a date-only value,
      and a date near the summer-time switch.
- [x] 2.2 In `createEvent` and `updateEvent`, read `noPage`. For a marker,
      store start and further dates at the start of their day, keep the hidden
      `end` as posted without checking it,
      and require an image (picked, uploaded, or already stored on edit),
      redirecting with `error=image-required` otherwise. Store
      `noPage: undefined` when unchecked so the key is removed. Add the message
      to `FORM_ERRORS`. Verify in the app: a marker without an image is
      refused, and with one is stored with a 00:00 start.

## 3. The form (D5)

- [x] 3.1 Add the "Geen pagina" checkbox below the title on the create and
      edit forms (checked on edit for a marker). Wrap the text, short
      description, end, venue, organisers and social links in
      `data-page-only` and add the `:has()` rule that hides them. Verify that
      checking the box hides those fields without scripts, and that a saved
      marker keeps their stored values.
- [x] 3.2 Make the start input and the further-date rows client inputs that
      follow the box and render `type="date"` while it is checked, converting
      values both ways. Verify in the app that checking and unchecking keeps the entered
      date.

## 4. Presentation (D3)

- [x] 4.1 `EventCard`: for a marker, an unlinked card with the whole image
      (fitted to the normal card image height, not cropped), a date badge without time, and the title.
- [x] 4.2 `EventRow` and `event-table.tsx`: for a marker, no link, and no time
      (the table's time cell shows "—").
- [x] 4.3 Verify in the app, in the agenda's card, text and table views and on
      the homepage, that a marker shows as specified, that its repeats or
      further dates each appear, and that an ordinary event next to it is
      unchanged.

## 5. Verify

- [x] 5.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [x] 5.2 In the app, turn a marker back into an event and check that its page
      returns with its earlier venue, organisers and text. Restore any content
      files the checks changed.

## 6. Tester feedback (2026-10-09)

- [x] 6.1 A marker's image sits on the card's white instead of a grey panel, so a
      16:9 image with a white background no longer shows as a box. Checked in
      the app next to ordinary event cards: same image height, no grey panel.
