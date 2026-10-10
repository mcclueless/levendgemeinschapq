# Tasks

Part 1 (groups 1–5) can be delivered without part 2 (groups 6–8).

## 1. Use for all images (D2)

- [x] 1.1 Add a pure `imageUsage(urls, users)` to `image-references.ts`
      returning the items that use each URL. Test covers, galleries, body
      text, an unused image, and an image used by two items.
- [x] 1.2 Move the content read out of `findImageReferences` into a
      `cache()`d `loadImageUsers()` in `admin.ts` that logs its read time, and
      build `findImageReferences` on it. Verify that deleting an image in use
      is still refused and names the same items.

## 2. The gallery's view (D1)

- [x] 2.1 Add a pure `parseMediaQuery(searchParams)` and
      `applyMediaQuery(items, usage, query)` with a page size of 48. Test
      defaults, invalid values, search ignoring case and accents, the use
      filter, each sort in both directions, paging and a page past the end.
- [x] 2.2 Rebuild the gallery page on them: search and filter form, sort
      links, the count, page controls, an in-use mark on each card, and the
      two empty states. Verify in the app with about 100 generated images.

## 3. A page per image (D3)

- [x] 3.1 Add `/beheer/galerij/<file name>`: large view, file name, size,
      upload date, address, the items that use it with links, and delete
      returning to the gallery view it came from. An unknown name is a 404.
- [x] 3.2 Add the copy-address button and the dimensions read from the loaded
      image, as a small client component. Verify the page without JavaScript
      shows everything else.

## 4. Upload and delete several (D4, D5)

- [x] 4.1 Build the uploader: several files by choosing or dropping, one
      request per file through `uploadInlineImage`, a result per file,
      and a refresh of the grid when done. Keep the single-file form working
      without JavaScript. Verify with five files of which one is not an image.
- [x] 4.2 Put the grid in one form with a checkbox per card and a "delete
      selected" button with confirmation, and add `deleteMediaBulk`: check
      each image with `imageUsage`, delete the unused, and return to the view
      reporting the number deleted and the names kept. Add "select all on
      this page" with JavaScript. Verify a selection that includes an image in
      use.

## 5. Search in the picker (D6)

- [x] 5.1 Add a search field to `MediaPicker` that filters the pool in the
      browser, with a "nothing found" state. Verify from the cover field, the
      organiser's image list and the body editor.

## 6. Image details (D7, D8)

- [x] 6.1 Add `media-details.ts`: the frontmatter schema (`title`, `alt`),
      `loadMediaDetails()` for the backend and `getMediaDetails(url)` for one
      image, both wrapped in `cache()`, save (removing the document when both
      are empty) and remove. Test the round trip, the empty save,
      and that an invalid document is skipped.
- [x] 6.2 Add optional `title` and `alt` to `MediaItem`, filled where the
      gallery and the forms list media. Show the title in place of the file
      name in the grid, on the image's page and in the picker, and include
      title and alternative text in both searches.
- [x] 6.3 Add the details form to the image's page and its action, which
      revalidates the pages of the items using the image and the listings.
      Make deleting an image, singly or in bulk, remove its details. Verify:
      set, change and clear a title and an alternative text; delete an image
      and check its details document is gone.

## 7. Alternative text where images are shown (D9)

- [x] 7.1 Add `imageAlt(url, fallback)` on the details lookup. Test an image
      with an alternative text, one without, and no image.
- [x] 7.2 Resolve it on the server and pass it as the `alt` of the cover
      image, event card, event page, slideshow, venue gallery and queue. Verify on a public event page that a described cover
      has its own text and an undescribed one has the event's title.
- [x] 7.3 Fill the body editor's description from the chosen image's stored
      alternative text, still editable and still required. Verify with a
      described and an undescribed image.

## 8. Replace a file (D10)

- [x] 8.1 Add `replaceMedia(key, file)` to `media.ts`: the same validation as
      an upload, the same format as the stored file, written to the same name
      with the verified content type. Store both new uploads and replacements
      with `Cache-Control: no-cache`. Test a matching file, another format,
      an oversized file and a mislabelled file.
- [x] 8.2 Add the replace form to the image's page, with the note that
      visitors may see the previous file for a time, and its action. Verify
      that the address is unchanged, an item using the image shows the new
      file after a hard reload, and the details are kept.

## 9. Verify

- [x] 9.1 Run `pnpm test`, `pnpm typecheck`, `pnpm lint` and, with the dev
      server stopped, `pnpm build`. All pass.
- [x] 9.2 Check the gallery, an image's page and the picker at phone width,
      by keyboard only, and with JavaScript disabled. Remove generated images
      and restore any content files the checks changed.
- [x] 9.3 On deploy: check that a newly uploaded image is served with
      `Cache-Control: no-cache`, that replacing it shows the new file on an
      ordinary reload, and that a described cover image has its own text on
      the live page.

## 10. Tester feedback (2026-10-09)

- [x] 10.1 Show images in the gallery grid, the image page and the picker at a
      versioned address (`src/content/media-url.ts`, tested), so a replaced
      file shows at once. Reproduced in the app before the fix (old picture
      until reload) and checked after it (new picture straight away).

