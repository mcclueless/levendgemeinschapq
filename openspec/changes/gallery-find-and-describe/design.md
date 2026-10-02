# Design

## Context

- **The gallery** (`galerij/page.tsx`) calls `listMedia()` and renders every
  image as a card: a thumbnail of the original file, the file name, a delete
  form. Upload is one file per form post.
- **A media item** is `{ url, key, size, lastModified }`, read from the listing
  of the public media bucket (`uploads/`), or `public/uploads` locally. Nothing
  else is known about an image.
- **Use is checked per image.** `findImageReferences(url)` reads all five
  content types in full, bodies included, and runs `imageReferencesIn`. It is
  called when a delete is attempted, and again to name the users.
- **The stored name is the address.** Content holds the image's URL in cover
  fields, galleries and body text. The name carries a random suffix, which the
  `media-library` spec requires.
- **Uploads are limited per request.** `serverActions.bodySizeLimit` is 12 MB,
  and one file may be 10 MB. `ImageListField` already uploads one file per
  request through `uploadInlineImage`.
- **Alternative text** is the page's own title at the cover, card, slideshow,
  gallery and queue; the body editor asks for a description per insertion.
- **The picker** (`MediaPicker`) receives the whole pool and shows it as a
  grid.
- **Configuration that is not content** lives beside the content in the
  content store under its own prefix (`feeds/`, see `feeds.ts`).

## Goals / Non-Goals

**Goals:**
- An image can be found, and unused images can be found and removed in bulk.
- An image is described once, and that description is used where it is shown.
- The gallery works without JavaScript; scripts add comfort.
- An image without details behaves exactly as today.

**Non-Goals:**
- Changing an image's stored name or address.
- Smaller copies of images, cropping, rotating, folders, tags, captions.

## Decisions

### D1. The gallery's view is in the address

As in the content lists (admin-content-table D4), a pure `parseMediaQuery` and
`applyMediaQuery` read and apply the view:

| Parameter | Values | Default |
|---|---|---|
| `q` | search text | none |
| `gebruik` | `gebruikt`, `ongebruikt` | all |
| `sort` | `datum`, `naam`, `grootte` | `datum` |
| `dir` | `asc`, `desc` | per column |
| `pagina` | a page number | 1 |

Search matches the file name, and the title and alternative text once part 2
exists, ignoring case and accents. A page holds 48 images. The controls are a
`GET` form and links. Actions return to the view they came from with
`returnPath` (admin-content-table D6).

### D2. Use for all images in one pass

A pure `imageUsage(urls, users)` beside `imageReferencesIn` returns the items
using each URL. The read that builds `users` moves out of
`findImageReferences` into a shared `loadImageUsers()`, wrapped in `cache()`.
The gallery calls it once.

Bodies are needed for the match, so summaries cannot serve this. The gallery
stays the one backend page that reads all content in full. Its read is logged
like the summary reads.

Alternative considered: `findImageReferences` per image. That is one full read
of all content per image.

### D3. A page per image

`/beheer/galerij/<file name>` shows one image: a large view, its file name,
size, upload date, address with a copy button, the items that use it, and
delete. With part 2 it also holds the details form and the replace form.

Dimensions are read in the browser from the loaded image. The listing does not
carry them, and reading them on the server would need a parser per format or a
new dependency. Without JavaScript the page shows none.

A page rather than a dialog: it has an address, works without JavaScript, and
gives part 2's forms a place.

### D4. Uploading several files

The upload control accepts several files, chosen or dropped. With JavaScript it
sends one request per file through `uploadInlineImage`, which returns a result
where `uploadMedia` redirects, and shows each file's result, then refreshes
the grid. `ImageListField` already uploads this way. One file's rejection does not stop the
others.

Without JavaScript the form stays a single-file upload. Several files in one
form post would exceed the 12 MB request limit with two ordinary phone photos.

### D5. Deleting several images

The grid sits in one form. Each card has a checkbox and a link to the image's
page; a "select all on this page" control is added with JavaScript. The action
checks every ticked image with `imageUsage`, deletes the unused ones, and
returns to the gallery reporting how many were deleted and naming those skipped
because they are in use. Deleting one image is done from its page.

### D6. Search in the picker

`MediaPicker` gains a search field that filters the pool in the browser, on the
file name and, with part 2, the title and alternative text. The pool is already
in the page.

### D7. Details are stored per image, in the content store

An image's details are a small document, `media/<file name>.mdx`, in the
content store, with `title` and `alt` in its frontmatter. A new
`media-details.ts` follows `feeds.ts`: validate on read, skip an invalid
document, and never register as a content type. Saving empty details removes
the document. Deleting an image removes its details.

`MediaItem` gains optional `title` and `alt`, filled where the gallery, the
forms and the picker list media.

Alternatives considered:
- Metadata on the stored object. The media bucket is public, the local store
  has no equivalent, and reading it costs a request per image.
- One JSON file for all images. Two saves at once would lose one.

### D8. A title, not a new file name

The title is shown in place of the file name in the grid, on the image's page
and in the picker, and search finds it. The stored name and the address never
change, so no content needs rewriting and the name stays unguessable.

### D9. The image's own alternative text, else today's

A helper, `imageAlt(url, fallback)`, returns the image's stored alternative
text when it has one and the fallback otherwise. It replaces the direct use of
the title at the cover image, the event card, the event page, the slideshow,
the venue gallery and the queue. An organiser's logo keeps the organiser's
name, as the `organisers` spec requires.

- **Resolved on the server.** A small server component, `DescribedImage`,
  renders the `<img>` with the resolved text; `CoverImage`, the event card,
  the event page, the venue gallery and the queue use it. `Slideshow` runs in
  the browser, so the organiser page resolves each slide's text and passes
  them in as strings.
- **Read per image shown.** A public page reads the details of the images it
  shows with a `cache()`d `getMediaDetails(url)`: the document's name follows
  from the image's address, so this is one read per image and no listing. The
  backend, which needs all details for the grid and the picker, lists the
  prefix with `loadMediaDetails()`.
- **Saving details revalidates.** A changed alternative text changes public
  pages. Saving or clearing details looks up the items that use the image with
  `imageUsage` and calls `revalidateContent` for their pages and the listings,
  as every content write does. Replacing a file (D10) does not: the pages are
  unchanged, only the file behind the address is.

Images inside a body keep the description written into the text. The body
editor's image dialog fills its description field from the stored alternative
text when an image is chosen, and the editor can change it for that use.

### D10. Replacing a file keeps its address

The replace form on the image's page uploads a new file to the same stored
name. The file passes the same validation as any upload and must be the same
format as the one it replaces, so the name's extension and the content type
stay true. Details are kept.

**Caching.** Checked on the live site on 2 October 2026: images are served
straight from the S3 media bucket, with no CDN in front of it and no
`Cache-Control` header, only `ETag` and `Last-Modified`. So there is nothing to
invalidate, and the only stale copies are in visitors' browsers. Without a
cache lifetime a browser keeps an image for roughly a tenth of its age, which
for an image uploaded months ago is days.

Uploads and replacements therefore store the file with
`Cache-Control: no-cache`. The browser then asks S3 whether its copy is still
current each time; S3 answers `304` when it is, and a replaced file shows at
once. An image stored before this change has no such header until it is
replaced once, so its first replacement can still show the old file to a
visitor who already has it. The form says that visitors may see the previous
file for a time.

Alternative considered: a short lifetime such as five minutes. It saves the
checks and leaves a short stale window; for a site this size `no-cache` is the
simpler promise.

Alternative considered: store the new file under a new name and rewrite every
reference. It avoids stale copies but rewrites documents, as a permalink change
does, for a rare action.

### D11. The backend layout no longer sends each page twice

Found while checking the gallery without JavaScript: the loading placeholder
from admin-content-table read the search parameters in the component that
wraps the page, which made the server send every backend page a second time as
a fallback. The address is now watched by a small component of its own that
renders nothing, so only that is sent twice. The placeholder behaves as before.

## Risks / Trade-offs

- [The gallery reads all content in full on every load] → one read per load
  instead of one per image check, and logged. An index would serve this later.
- [Public pages read image details on every render] → one small read per
  image shown, not per image stored, and none for a listing (D9). A page of
  event cards is the largest case; it is a candidate for the index later.
- [A replaced image shows its old version from a browser's cache] → files are
  stored with `Cache-Control: no-cache` from now on (D10). Images stored
  earlier can be stale on their first replacement, which the form states.
- [`no-cache` adds a request per image view] → a `304` without a body. If the
  media is later put behind a CDN (`NEXT_PUBLIC_MEDIA_BASE_URL`), replacing
  must also invalidate it there; revisit D10 then.
- [A bulk delete is not atomic] → each image is checked and deleted on its
  own, and the result names what was skipped.
- [Details for an image that no longer exists] → removed with the image; a
  stray document is ignored, since details are looked up from listed images.
- [A rollback after part 2] → details documents are ignored by older code, and
  alternative texts return to the page titles.

## Migration Plan

None. Existing images have no details and behave as today.

## Open Questions

None. Whether a CDN sits in front of the media bucket was checked on the live
site and answered in D10.
