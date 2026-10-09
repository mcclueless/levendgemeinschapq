## Why

An organiser's slideshow shows photos without a word about them. The editor
wants a caption under each slide, written where the organiser is edited.
Captions were left out of the organiser-page-layout change; this adds them.

## What Changes

- **A caption per image**, stored with the image's other details (title,
  alternative text) in the media library, so one caption serves the image
  wherever a slideshow shows it.
- **Edited in the organiser form:** each row of the organiser's image list
  gets a caption field, prefilled with the image's current caption and saved
  with the organiser.
- **Also on the image's own page** in the gallery, next to title and
  alternative text, since that is where the caption lives.
- **Shown under the slide** on the organiser's page, moving with the slide.
  A slide without a caption shows nothing, so slideshows without captions
  look as they do today. The single-image case shows its caption too.
- Alternative text is unchanged and separate: the caption is read by
  everyone, the alternative text describes the image for those who cannot
  see it.

Not in scope:
- a different caption for the same image on different pages
- captions on the venue gallery or on cover images
- captions on images in body text

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organisers`: new requirement **slide captions**.
- `media-library`: new requirement **image caption**, a third detail beside
  title and alternative text.
- `editorial-backend`: new requirement **captions on the organiser's image
  list**.

## Impact

- `src/content/media-details.ts`: `caption` in the details schema; a save
  that keeps the other details.
- `src/components/admin/image-list-field.tsx`: a caption input per row.
- `src/app/beheer/actions.ts`: the organiser create and update actions save
  captions; the image page's details action saves the caption.
- `src/app/beheer/(shell)/galerij/[name]/page.tsx`: the caption field.
- `src/components/content/slideshow.tsx` and the organiser page: captions
  under the slides.
- Stored organiser documents do not change.
