## Why

The gallery's upload control is the raw browser file input under a "Nieuwe
afbeelding" label. The tester reported on 14 October 2026 that it is not
obvious how to add an image there. The design system already requires a
styled upload control that looks like the buttons beside it (the cover-image
and image-list fields have one, "Nieuwe afbeelding uploaden"), but the gallery
page never received it.

## What Changes

- The gallery's upload control presents as a **button** that matches the
  backend's other buttons, driving a hidden native file input, as the content
  forms' upload controls already do. The drop zone and the per-file results
  stay as they are.
- The button's label names the action: **"Afbeeldingen uploaden"** rather than
  a field label that reads as a heading.
- **Without JavaScript** the gallery keeps its plain single-file form with its
  own "Uploaden" button, as the media-library spec requires.
- Choosing files still starts the upload at once; no second step is added.

Not in scope: the other upload controls, which already follow the pattern;
the drop zone's look.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `media-library`: requirement **Upload images from the library** gains the
  control's affordance — a button matching the backend's buttons once scripts
  run, the plain form without them.

## Impact

- `src/components/admin/media-uploader.tsx`: the enhanced branch renders a
  button and a visually hidden input instead of a visible input.
- `src/components/admin/image-field.tsx`: its empty-pool hint tells the editor
  to upload via "Nieuwe afbeelding", which must name the new button instead.
- No stored content, no API, no migration.
