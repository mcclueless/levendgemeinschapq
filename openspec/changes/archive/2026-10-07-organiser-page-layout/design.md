# Design

## Context

The organiser page (`src/app/organisatoren/[slug]/page.tsx`) currently stacks:
1. a badge
2. the name
3. a full-width 2:1 `CoverImage`, which renders nothing without an image
4. a two-column grid of the text and the contact card
5. "Binnenkort van …"

Organisers store one `featuredImage`, which also feeds lists and share
previews. `ImageField` sets one image through the fixed form names
`featuredImageUrl` (picked) and `image` (uploaded). It has no way to remove an
image. `MediaPicker` (the gallery dialog) and `uploadInlineImage` (upload,
returns the URL) already exist from the body editor. The in-use check lists, per
item, `cover` and `gallery` (`image-references.ts`, users built in `admin.ts`).

As before, `parseAll` skips invalid documents, so new fields must be optional
and existing fields must keep their shape.

## Goals / Non-Goals

**Goals:**
- The sketched layout, with no change for organisers that have one image and
  no logo, beyond the layout itself.
- A slideshow that is manual, accessible and usable without JavaScript.
- No stored-data conversion.

**Non-Goals:**
- Venue pages, automatic sliding, captions, cropping tools.

## Decisions

### D1. Storage: keep `featuredImage`, add `moreImages` and `logo`

`OrganiserFrontmatter` gains `moreImages: z.array(z.string().min(1)).optional()`
and `logo: z.string().min(1).optional()`. The slides are `[featuredImage,
...moreImages]`. Everything that uses the cover today keeps reading
`featuredImage`: the organiser cards, share images and lists.

`Organiser` (`types.ts`) gains:
- `images: string[]`: all slides, deduplicated, empty when there are none
- `logo?: string`

Both are built in `repository.ts` by one pure helper, `organiserImages(data)`.

Alternative considered: one `images` list replacing `featuredImage`. That is
cleaner, but every cover consumer would change, and a rollback would hide the
cover of every organiser saved since.

### D2. The form posts one ordered list

A new client field, `ImageListField`, renders one row per image. Each row has a
thumbnail and buttons to move it earlier, move it later, and remove it. Each
row carries a hidden `<input name="images" value=url>`. "Toevoegen uit
galerij" opens `MediaPicker`. "Uploaden" sends the file to `uploadInlineImage`
and appends the returned URL.

The server reads `getAll("images")`. A pure helper,
`organiserImageFields(urls)`, turns the list into
`{ featuredImage: first, moreImages: rest | undefined }`. Both keys are always
in the patch, so the merge clears removed images, as with organisers (D3 of
`event-multiple-organisers`).

Rows are rendered on the server, so without JavaScript the stored images still
post unchanged. Only adding, removing and moving need scripts, the same as the
body editor's image control.

An upload is stored as soon as it is chosen, before the form is saved, as in
the body editor. An abandoned upload simply stays in the gallery.

### D3. The logo reuses `ImageField`

`ImageField` gains optional props:
- `urlName` and `fileName`, defaulting to today's `featuredImageUrl` and
  `image`
- `removable`, which shows a "Verwijderen" button that posts `<urlName>Remove`

The logo field uses `logoUrl`, `logo` and `removable`. `coverImage()` in
`actions.ts` takes the field names as a parameter, so it resolves the logo the
same way: a picked image, else an upload, else unchanged. The remove flag sets
`logo: undefined`, which the merge clears. Every other `ImageField` user is
unchanged.

### D4. The slideshow

The new `src/components/content/slideshow.tsx` is a client component:
- **Track:** a horizontal list with CSS scroll-snap (`overflow-x-auto
  snap-x snap-mandatory`). Each slide is full width at 2:1 with
  `object-cover`. This works and swipes without JavaScript.
- **Controls:** previous/next buttons and one dot per slide. They call
  `scrollTo` on the track and read the current slide from its scroll position.
  They are `<button>`s with names ("Vorige afbeelding", "Afbeelding 2 van 3"),
  with `aria-current` on the dot of the slide shown.
- **No autoplay**, so no pause control is needed.
- **Edge cases:** one image renders a plain image without controls or a track,
  and none renders nothing, as `CoverImage` does today.
- **Alt text:** "<name> — afbeelding <n>", matching the venue gallery.

### D5. Layout with one grid and source order

The page becomes one `grid lg:grid-cols-[1fr_20rem]` whose children appear in
the phone order: name, logo, slideshow, text, contact. On `lg` they are placed
explicitly:

| Element   | Column | Row                                   |
|-----------|--------|---------------------------------------|
| name      | 1      | 1                                     |
| logo      | 2      | 1                                     |
| slideshow | 1      | 2                                     |
| text      | 1      | 3                                     |
| contact   | 2      | 2 / span 2 (1 / span 3 without logo)  |

One DOM order serves both layouts, so reading and tab order follow the phone
order everywhere. "Binnenkort van …" stays below the grid. The badge is
removed.

The side column is a fixed `20rem`, narrower than a long email or web address,
which has no spaces to wrap at. `ContactInfo` therefore lets a value break
anywhere (`min-w-0` and `overflow-wrap: anywhere` on the value) and offers soft
break points after "@" and "/", so it wraps at a natural place first. The
component is shared, so venue pages get the same behaviour.

### D6. References and structured data

The organiser's image user in `admin.ts` gets `gallery: [...moreImages, logo]`.
`imageReferencesIn` already checks galleries, so the logo and slides count as
in use. `organiserJsonLd` adds `logo` (absolute URL) when set, and `image` for
the slides.

## Risks / Trade-offs

- [A rollback] → old code strips `moreImages` and `logo`. Organisers show
  their first image and the old layout, and nothing disappears. If an
  organiser is saved under old code, the merge keeps both fields.
- [A logo with a white background next to a card] → the logo is shown at its
  own aspect ratio inside a bounded box, with no frame. Editors choose the
  file.
- [Uploads stored before saving] → this is the accepted behaviour from the
  body editor, and they appear in the gallery for reuse or deletion.

## Migration Plan

None. Existing organisers have one or no image and no logo, and render in the
new layout with no controls.
