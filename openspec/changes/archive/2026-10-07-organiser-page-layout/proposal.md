## Why

An organiser's page should feel like theirs: their logo, more than one photo,
and their contact details beside the content. Today the page puts a badge and
the name above one full-width cover photo, with the contact card only beside
the text. Organisers have no logo, and can have only one image. The editor
sketched the layout they want (`orgpages.png`).

## What Changes

- **New layout on the organiser page:**
  - Two columns from the top. The left column has the name, then the images,
    then the text. The right column has the logo, then the contact card.
  - "Binnenkort van …" stays full width below.
  - The "Organisator" badge goes.
  - Without a logo, the contact card moves to the top of the right column.
  - On a narrow screen, one column: name, logo, images, text, contact,
    events.
- **Logo:** a new optional image for each organiser.
- **Images as a slideshow:** an organiser can have several images, shown as a
  manual slideshow. There are previous/next buttons and a dot per slide, and
  visitors can swipe. It never moves on its own, and it scrolls without
  JavaScript. One image shows as a plain image, with no controls. Slides keep
  today's 2:1 shape.
- **Admin, on the organiser create and edit forms:**
  - **"Afbeeldingen":** an ordered list of images, added by uploading or by
    picking from the gallery, and removable or movable up and down. The first
    image is the organiser's cover everywhere else (lists, share previews).
  - **"Logo":** a separate field, which can also be removed.
- **Image delete safety:** the gallery treats an organiser's logo and every one
  of its slides as in use.
- **Storage is backward compatible.** `featuredImage` stays the first image.
  The other images and the logo go in new optional fields. Existing organisers
  need no conversion.

Not in scope:
- location (venue) pages, which can follow later and reuse the slideshow
- automatic slide changes
- captions per slide

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organisers`:
  - new requirement: **organiser logo**
  - new requirement: **organiser image slideshow**
  - new requirement: **organiser page layout**
- `editorial-backend`:
  - new requirement: **managing an organiser's images and logo**
- `media-library`:
  - **Reference-safe image deletion** also counts an organiser's logo and
    slides.

## Impact

- `src/content/schema.ts`, `types.ts`, `repository.ts`: optional
  `moreImages` and `logo` on organisers.
- `src/app/organisatoren/[slug]/page.tsx`: the new layout. A new slideshow
  component in `src/components/content/`.
- Admin:
  - a new image-list field, reusing `MediaPicker` and `uploadInlineImage`
  - `ImageField` gains configurable field names and a remove option, for the
    logo
  - the organiser create and edit forms and their actions
- `src/content/admin.ts` / `image-references.ts`: the logo and slides count
  as references.
- `src/lib/structured-data.ts`: the organiser's `logo` in its Organization
  data.
- Unchanged: organiser lists and cards, events, venues. No new dependency.
