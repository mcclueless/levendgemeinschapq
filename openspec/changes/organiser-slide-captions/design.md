# Design

## Context

- An organiser's images are URLs in `featuredImage` and `moreImages`; the
  form's `ImageListField` posts them as `images`, in order, and
  `organiserImageFields` stores them.
- An image's details (`title`, `alt`) live in `media/<file name>.mdx` in the
  content store (gallery-find-and-describe D7), edited on the image's page,
  and listed on every `MediaItem`.
- `Slideshow` runs in the browser and takes per-slide `alts` resolved by the
  organiser page.

## Goals / Non-Goals

**Goals:** a caption is written once, where the editor is, and shown under the
slide.

**Non-Goals:** per-page captions; captions outside the organiser slideshow.

## Decisions

### D1. The caption is an image detail

`MediaDetails` gains `caption`, optional like the others. `MediaItem` carries
it. The image's page gets a field for it. One caption per image, wherever it
is shown, as the image's title and alternative text already are.

Alternative considered: a `captions` list in the organiser document, parallel
to its images. It would need keeping in step on every reorder and removal, and
a photo used by two organisers would be captioned twice.

### D2. Edited in the organiser form, saved to the image

Each row of `ImageListField` gets a text input named `captions`, in the same
order as the hidden `images` inputs, prefilled from the pool's `caption` for
that URL. A new row from the gallery starts with the image's caption; an
upload starts empty.

The organiser create and update actions read the pairs and call
`updateMediaDetails(name, { caption })`, which keeps the image's title and
alternative text and removes the document when nothing is left. A caption is
written only when it differs from the stored one, so saving an organiser does
not rewrite every image's details.

Rendered on the server, the rows post unchanged without JavaScript, captions
included.

### D3. Shown as a figure caption

`Slideshow` takes `captions?: string[]`. Each slide becomes a `<figure>` with
the image and, when there is text, a `<figcaption>` under it in the muted
text style. The single-image case is a figure too. The organiser page resolves
captions with `getMediaDetails`, as it resolves the alternative texts.

The caption sits under the image rather than over it: an overlay fights the
photo and needs a contrast band.

## Risks / Trade-offs

- [Two organisers share a photo and want different captions] → out of scope;
  the caption is the image's. The form says the caption belongs to the image.
- [Saving an organiser writes to the media details] → only for captions that
  changed.
