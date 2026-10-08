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
`aria-label="Uitleg over de afbeelding"`. Native `<details>` opens by click,
Enter and Space without JavaScript, and announces its state.

The opened panel is a block below the label row, not a floating popover: no
positioning code, nothing clipped at phone width, and it pushes the field down
rather than covering it.

*Alternative: a hint line always visible.* Rejected: the cover text with its
picture is too long to show on every form permanently.

### D2. One component, two texts

`ImageGuidance({ kind: "cover" | "logo" })` renders the text. Both say
1920 × 1080 (16:9). Cover adds the safe area and its picture; logo says it is
shown whole on a white panel. File types and size come from constants exported
by `media.ts`, never typed twice, so the advice cannot drift from validation.
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
