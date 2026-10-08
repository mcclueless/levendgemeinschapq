## Why

Editors and visitors upload images without knowing what shape the site needs.
The team agreed on 29 September 2026 to export images at 16:9, but nothing in
the forms says so, and the site does not show covers at 16:9 anywhere. Measured
on goeddoen.net on 8 October 2026, a 16:9 cover is cut at the top and bottom on
detail pages (2:1) and agenda cards (1.7 to 2.0), and at the sides on the
homepage's project cards (1.35 to 1.54). Text near any edge of a poster can
disappear on one page and survive on another. A tester asked for an info badge
beside the image fields that explains the size and ratio to use.

## What Changes

- An **info button** beside each image field opens a short explanation. It
  opens by click or keyboard and works without JavaScript.
- **Cover advice:** upload 1920 × 1080 pixels (16:9). Keep text, faces and
  logos inside the central 1440 × 960, because the area outside it may be cut
  off on some pages. A small picture marks that safe area. The accepted file
  types and the 10 MB limit are stated.
- **Logo advice:** upload 1920 × 1080 pixels (16:9). A logo is shown whole and
  never cut off. A white or transparent background works best.
- The button appears on the cover field of every admin create and edit form
  (event, venue, organiser, blog post, project), on the organiser logo field,
  and on the image upload of the public event submission form.

Not in scope: changing how any page crops images; the blog overview's
full-width card, which crops a cover to a thin strip at desktop width and gets
its own change; venue gallery images; checking or resizing uploads
automatically.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editorial-backend`: new requirement **Image guidance beside image fields**,
  covering the admin forms and the public submission form.

## Impact

- `src/components/admin/form.tsx`: an optional info slot on `Field`, and the
  guidance component with its two texts.
- The admin create and edit pages for all five content types, and
  `src/app/evenement-indienen/page.tsx`.
- No change to stored content, uploads, or any public page. No new dependency.
