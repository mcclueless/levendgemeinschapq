## 1. Model (D1, D2)

- [ ] 1.1 Add optional `externalUrl` to the event schema with the http/https
      rule used for social links; carry it through `types.ts`, the repository
      and `summaries.ts`. Test that `javascript:` and relative values are
      refused and an existing file without it still parses.
- [ ] 1.2 Add `hasOwnPage(event)` (neither marker nor external; a file with
      both counts as a marker) with tests, and use it in `getEvent` and
      `sitemap.ts`.

## 2. Listings (D3)

- [ ] 2.1 Make `occurrenceLink` return the external address for an external
      event, with tests for all three modes.
- [ ] 2.2 In `EventCard`, `EventRow` and the event table, render an external
      event as an ordinary one with a plain `<a rel="noopener noreferrer">`,
      an `aria-hidden` "↗" and visually hidden "(opent website van <host>)".
      Test the hostname helper (drops `www.`).

## 3. Form (D4, D5)

- [ ] 3.1 Replace `NoPageField` with `EventModeField`: three `mode` radios and
      an address input; CSS in `globals.css` hides fields per mode without
      scripts; mark body, short description and social links `data-page-text`.
- [ ] 3.2 In the create and update actions, read `mode`: set or clear
      `noPage` and `externalUrl` as in D4, require an image and a valid address
      for `external`, run the marker date handling only for `marker`. Add the
      `external-url` error message. Preselect the stored mode on the edit form.
- [ ] 3.3 Test the mode parsing and that switching modes never clears other
      fields, in the style of the existing action and merge tests.

## 4. Verify

- [ ] 4.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`, also under
      `TZ=UTC`. All pass.
- [ ] 4.2 In the app with temporary content: an external event in card, text
      and table views and on its organiser's page links out with the mark and
      its screen-reader text; its own address returns 404 and it is absent from
      the sitemap; the form switches between all three modes with and without
      JavaScript; a `javascript:` address and a missing image are refused;
      switching back to an own page keeps text and venue; existing events and
      markers look and link as before. Remove the temporary content.
- [ ] 4.3 After deploy, create an external test event on goeddoen.net, check the
      agenda and its 404, then delete it.
