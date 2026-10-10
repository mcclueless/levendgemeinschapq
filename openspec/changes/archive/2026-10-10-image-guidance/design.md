## Context

Image fields render through the shared `Field` primitive in
`src/components/admin/form.tsx` (label, control, hint). Covers use
`ImageField` on the admin forms and `UploadOnlyImageField` on the public
submission form; the organiser logo uses `ImageField` with `urlName="logoUrl"`.
Upload validation lives in `src/content/media.ts`: extensions
`png|jpe?g|gif|webp|avif`, `MAX_UPLOAD_BYTES` 10 MB.

Measured on goeddoen.net on 2026-10-08 at 375–1536 px, editor covers are shown at:

| Surface | Ratio | A 16:9 file loses |
|---|---|---|
| Detail pages, organiser slideshow | 2:1 | ~6% top and bottom |
| Agenda and venue cards, homepage "Binnenkort" | 1.7–2.0 | up to ~5% top and bottom |
| Homepage project cards | 1.35–1.54 | up to ~12% left and right |
| Blog overview card at desktop width | 4.85 | ~63% of the height (separate change) |

## Goals / Non-Goals

**Goals:** editors and visitors learn, at the field, what to upload and where
the site may cut; the advice is true for every surface except the blog outlier.

**Non-Goals:** changing crops; validating or resizing uploads; gallery images.

## Decisions

### D1. A native disclosure beside the label

`Field` gains an optional `info` prop. When set, a `<details>` sits on the label
row, after the `<label>` (never inside it, so clicking the label still focuses
the control). Its `<summary>` is a small round "i" button with
an accessible name of "Uitleg: " plus the field label. Native `<details>` opens by click,
Enter and Space without JavaScript, and announces its state.

The "i" is pinned to the right end of the label row (`absolute`, the field
`relative`), and the opened panel sits in the normal flow between the label and
the control, pushing the field down. *Revised during implementation:* a first
version overlaid the panel on the field; in a browser check an open panel then
covered the next field's own "i" button, and without JavaScript there is no
click-outside to close it. Pinning the button keeps it from jumping when the
panel opens, which is why the panel could not simply follow it in the flow.

*Alternative: a hint line always visible.* Rejected: the cover text with its
picture is too long to show on every form permanently.

### D2. One component, two texts

`ImageGuidance({ kind: "cover" | "logo" })` renders the text. Both say
1920 × 1080 (16:9). Cover adds the safe area and its picture; logo says it is
shown whole on a white panel. File types and size come from `upload-rules.ts`,
a dependency-free module that `media.ts` also reads, never typed twice, so the advice cannot drift from validation.
The component holds no data, so it is safe on the public form.

### D3. The safe area: central 1440 × 960

The safe area is the intersection of the crops in the table, excluding the blog
outlier: three quarters of the width (covers the 1.35 homepage card) and nine
tenths of the height (covers 2:1). Rounded to whole pixels of a 1920 × 1080
file: 1440 × 960, centred. Drawn as an inline SVG — a 16:9 frame with the
central rectangle outlined and labelled — sized to the panel, with a text
equivalent so the picture is not the only carrier of the advice.

### D4. Where it goes

Cover field: event, venue, organiser, blog, project, on create and edit forms.
Logo field: organiser create and edit. Public submission: the image upload.
The public form's existing hint ("JPG, PNG, GIF, WebP of AVIF, maximaal 10 MB")
stays; the admin cover hints stay as they are.

## Risks / Trade-offs

- **[Advice drifts when a layout changes]** A future card shape could crop
  outside 1440 × 960. → The table above is the source; a design that changes a
  cover's shape should check it against the safe area.
- **[The blog overview contradicts the advice]** Until its own change lands. →
  Recorded as a non-goal and a separate change.

## Migration Plan

None. Deploy, then check the button on one admin form and the public form.

## Tester feedback (2026-10-09)

Atticus asked for the safe-area sentence to follow the size sentence directly,
for "Geaccepteerde formaten:" before the file list, for the picture to show the
1440 × 960 area inside the labelled 1920 × 1080 frame, and supplied reworded
logo text. All applied; the picture's frame label sits in its left margin,
since the top margin is too thin for text.


## Tester feedback (2026-10-10)

Atticus asked for the frame's 1920 × 1080 label to sit under the inner
rectangle rather than in the left margin, because it looks neater there.
Applied: the label is one line now, centred in the strip between the safe area
and the bottom edge, which is the only way it fits a strip that thin.
