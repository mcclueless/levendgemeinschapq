## 1. Component (D1, D2, D3)

- [ ] 1.1 Export the accepted extensions as a display list and
      `MAX_UPLOAD_BYTES` from `src/content/media.ts`, and test that the display
      list matches the validation pattern.
- [ ] 1.2 Add `ImageGuidance({ kind })` with the cover and logo texts and the
      safe-area SVG with its text equivalent; file types and size come from the
      `media.ts` constants.
- [ ] 1.3 Add the optional `info` prop to `Field`: a `<details>` after the
      `<label>`, an "i" summary with an accessible name, the panel below the
      label row. Verify with `pnpm typecheck` and `pnpm lint`.

## 2. Place it (D4)

- [ ] 2.1 Cover fields on the event, venue, organiser, blog and project create
      and edit forms get `info={<ImageGuidance kind="cover" />}`.
- [ ] 2.2 The organiser logo field, on create and edit, gets the logo guidance.
- [ ] 2.3 The public submission form's image upload gets the cover guidance;
      confirm the page payload still carries no media-library data.

## 3. Verify

- [ ] 3.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [ ] 3.2 In the app: open and close each guidance by mouse and by keyboard;
      with JavaScript disabled; at phone width the panel fits without
      horizontal scrolling; clicking the field label still focuses its control;
      the logo field shows logo guidance and every cover field cover guidance.
- [ ] 3.3 After deploy, open the guidance on goeddoen.net's submission form.
