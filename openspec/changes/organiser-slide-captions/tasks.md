# Tasks

## 1. The caption as an image detail (D1)

- [x] 1.1 Add `caption` to `MediaDetails`, `detailsDocument`, `MediaItem` and
      the gallery search, and add `updateMediaDetails(name, patch)` that
      keeps the other details and removes the document when all are empty.
      Test the round trip with three details, a patch that keeps the others,
      and a patch that empties the last one.
- [x] 1.2 Add the caption field to the image's page and its action, and show
      it in the gallery search. Verify set, change and clear.

## 2. The organiser form (D2)

- [x] 2.1 Add a caption input per row to `ImageListField`, prefilled from the
      pool, posted as `captions` in row order; a row from the gallery starts
      with the image's caption, an upload empty.
- [x] 2.2 In `createOrganiser` and `updateOrganiser`, pair `images` with
      `captions` and write each caption that differs from the stored one.
      Verify: write, change and clear a caption from the organiser form, and
      that it appears on the image's gallery page.

## 3. The slideshow (D3)

- [x] 3.1 Give `Slideshow` a `captions` prop and render each slide as a
      figure with a caption beneath when there is text; the single-image case
      too. Resolve the captions on the organiser page. Verify an organiser
      with a captioned second image, a captioned single image, and one
      without captions.

## 4. Verify

- [x] 4.1 Run `pnpm test`, `pnpm typecheck`, `pnpm lint` and, with the dev
      server stopped, `pnpm build`. Check the organiser form and page at
      phone width and with JavaScript disabled. Remove test details and
      restore any content files the checks changed.
