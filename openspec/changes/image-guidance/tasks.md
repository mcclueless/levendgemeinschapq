## 1. Component (D1, D2, D3)

- [x] 1.1 Move the accepted extensions and `MAX_UPLOAD_BYTES` into a
      dependency-free `src/content/upload-rules.ts` with a display list (media.ts
      uses Node APIs that client code must not import), and test that the
      display list matches the validation pattern.
- [x] 1.2 Add `ImageGuidance({ kind })` with the cover and logo texts and the
      safe-area SVG with its text equivalent; file types and size come from
      `upload-rules.ts`.
- [x] 1.3 Add the optional `info` prop to `Field`: a `<details>` after the
      `<label>`, an "i" summary with an accessible name, the panel below the
      label row. Verify with `pnpm typecheck` and `pnpm lint`.

## 2. Place it (D4)

- [x] 2.1 Cover fields on the event, venue, organiser, blog and project create
      and edit forms get `info={<ImageGuidance kind="cover" />}`.
- [x] 2.2 The organiser logo field, on create and edit, gets the logo guidance.
- [x] 2.3 The public submission form's image upload gets the cover guidance;
      confirm the page payload still carries no media-library data.

## 3. Verify

- [x] 3.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [x] 3.2 In the app: open and close each guidance by mouse and by keyboard;
      with JavaScript disabled; at phone width the panel fits without
      horizontal scrolling; clicking the field label still focuses its control;
      the logo field shows logo guidance and every cover field cover guidance.
- [x] 3.3 After deploy, open the guidance on goeddoen.net's submission form.
