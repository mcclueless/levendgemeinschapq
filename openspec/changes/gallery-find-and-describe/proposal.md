## Why

The gallery is a grid of thumbnails with a file name and a delete button. An
image cannot be searched for, there is no way to see what is unused, and files
go in one at a time although the spec already promises "one or more". An image
is also a bare file: it has no name of its own and no description, so every
place that shows it invents an alternative text from the page it is on. The
editor asked for what WordPress's media library offers for finding, tidying and
describing images.

## What Changes

The change has two parts. The first can be delivered without the second.

**Part 1 — find and tidy**

- **Search, sort and paging** in the gallery:
  - search on the file name (and, with part 2, the title and description)
  - sort by upload date, name or size
  - 48 images per page
  - the view is in the address, as in the content lists
- **"Used in"** for every image: the gallery shows whether an image is in use,
  and an image's own page lists the items that use it, with links.
- **Filter on use:** all, in use, or unused.
- **A page per image**, opened from the grid: a large view, file name, size,
  dimensions, upload date, its address with a copy button, where it is used,
  and delete.
- **Upload several at once**, by choosing several files or dropping them on
  the page. Each file reports its own result. Without JavaScript the single
  upload stays as it is.
- **Delete several at once:** tick images and delete them together. Images
  still in use are skipped and named.
- **Search in the "Kies uit galerij" dialog** on the forms and in the body
  editor.

**Part 2 — describe**

- **Title:** a readable name for an image, shown in place of the file name and
  found by search. This is what "rename" means here: the stored file name does
  not change.
- **Alternative text:** a description of the image for people who cannot see
  it, set once on the image.
  - Where an image is shown as a cover, in a gallery or in a slideshow, its
    own description is used. An image without one keeps today's text.
  - The body editor's image dialog starts from the stored description.
- **Replace the file:** put a new file in place of an image. Everything that
  uses the image shows the new one. The new file must be the same format.

Not in scope:
- renaming the stored file; its address is what content points at
- smaller copies of images for faster pages
- cropping or rotating
- folders or tags
- captions

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `media-library`:
  - **Browse the image bank** gains search, sorting, a filter on use, and
    paging.
  - **Upload images from the library** covers several files at once, each with
    its own result.
  - new requirement: **where an image is used**
  - new requirement: **a page per image**
  - new requirement: **deleting several images at once**
  - new requirement: **image title and alternative text**
  - new requirement: **an image's alternative text is used where it is shown**
  - new requirement: **replacing an image's file**
- `editorial-backend`:
  - new requirement: **searching the image pool**
  - new requirement: **the body image description starts from the stored one**

## Impact

- `src/app/beheer/(shell)/galerij/`: the gallery page; a new page per image.
- `src/app/beheer/actions.ts`: bulk delete, save details, replace file.
- `src/content/`:
  - a new module for the gallery's view (search, sort, filter, paging)
  - `image-references.ts`: use for all images in one pass
  - `admin.ts`: the content read behind the image check, shared
  - a new module for image details, stored under `media/` in the content store
  - `media.ts`: replace a stored file; delete also removes the details
- `src/components/admin/`: a multi-file uploader; search in `MediaPicker`; the
  body editor's image dialog.
- Public pages, for the alternative text: `cover-image.tsx`, `event-card.tsx`,
  `slideshow.tsx`, `gallery.tsx`, the event page and the queue.
- No new dependency. Stored content documents do not change.
