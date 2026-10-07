# Tasks

## 1. Data (D1)

- [x] 1.1 Add optional `moreImages` and `logo` to `OrganiserFrontmatter`, and
      `images: string[]` and `logo?: string` to `Organiser`. Add a pure
      `organiserImages(data)` helper (first `featuredImage`, then `moreImages`,
      deduplicated) and use it in `repository.ts`. Test: no images, cover only,
      cover plus more, a duplicate, and an old file without the new keys.

## 2. Saving (D2, D3)

- [x] 2.1 Add a pure `organiserImageFields(urls)` helper returning
      `{ featuredImage, moreImages }` with both keys always present. Test none,
      one, several and duplicates, and through `mergeDocument` that removing
      images clears them from a stored file.
- [x] 2.2 Generalise `coverImage()` to take the picked and uploaded field
      names, and give `ImageField` the optional `urlName`, `fileName` and
      `removable` props. Verify with `pnpm typecheck` that existing callers are
      unchanged.
- [x] 2.3 In `createOrganiser` and `updateOrganiser`, store the posted image
      list with the helper and the logo (picked, uploaded, removed or
      unchanged).

## 3. Admin forms (D2, D3)

- [x] 3.1 Build `ImageListField`: server-rendered rows with hidden `images`
      inputs; move earlier, move later and remove; add from gallery
      (`MediaPicker`) or by upload (`uploadInlineImage`, showing rejections).
      Buttons have accessible names.
- [x] 3.2 On the organiser create and edit forms, replace the cover
      `ImageField` with "Afbeeldingen" (`ImageListField`, prefilled with
      `organiserImages` on edit) and add "Logo" (`ImageField`, removable).
      Verify in the app: add two images (one upload, one from the gallery),
      reorder, save, and check the stored fields; set and remove a logo.

## 4. Public page (D4, D5, D6)

- [x] 4.1 Build `Slideshow`: a scroll-snap track, previous/next and dot
      buttons with accessible names and `aria-current`, no autoplay, a plain
      image for one slide, nothing for none.
- [x] 4.2 Rebuild the organiser page layout as in D5 (grid placement, logo,
      contact spanning, badge removed).
- [x] 4.2a Keep a long email or web address inside the contact card: let the
      value wrap anywhere, with soft break points after "@" and "/"
      (`ContactInfo`, shared with venue pages).
- [x] 4.3 Add the logo and slides to the organiser's image references in
      `admin.ts`, and `logo` and `image` to `organiserJsonLd`. Test the
      references with a logo-only and a slide-only image, and the JSON-LD with
      and without a logo.

## 5. Verify

- [x] 5.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [x] 5.2 In the app, check an organiser with three images and a logo on a
      wide and a phone-width screen: the layout and order, slide controls by
      mouse and keyboard, swiping (scrolling) without moving on its own, and
      an image used only as a slide or logo being blocked from deletion. Check
      an organiser with one image and no logo shows no controls and no logo
      area. Restore any content files the checks changed.
