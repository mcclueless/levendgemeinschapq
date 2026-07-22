## Why

The homepage has no photography at all. It opens with a heading, a paragraph,
two buttons and two faint radial gradients, then drops straight into two card
grids. `public/` contains exactly one asset, `event-placeholder.svg`. For a site
about a *neighbourhood* — its processions, its street parties, its brass band —
that is a page with nothing of the neighbourhood on it.

The organisation's existing WordPress site at `hopehappystars.com` (this
project's predecessor) solves that with a simple device: rows split between a
full-bleed photograph and a flat colour panel, with the photographs washed in a
flat colour at `opacity: 0.7`. The wash is what makes mixed-quality community
snapshots read as one deliberate thing rather than a shared album.

That device is worth borrowing. The palette is not — see Non-Goals.

## What Changes

- Restyle the homepage as **split photo/colour panels**, using two photographs
  from the existing site: `Sint-Theresiakerk-2.jpg` for the hero and
  `Projects.jpg` above the projects section.
- Apply a **duotone wash** — the brand green over each photograph — so the
  imagery is tinted rather than raw, matching the device that makes the
  reference site cohere.
- Add **alternating bands** between sections using the existing surface tokens,
  so the page has rhythm instead of one flat scroll.
- Self-host both photographs as downscaled static assets under `public/`.
- **No text changes anywhere.** The `h1`, the intro paragraph, both call-to-action
  buttons, and both section titles/subtitles keep their current wording exactly.
  Only the frame around them changes.

## Capabilities

### Added Capabilities

- `homepage`: The homepage's visual composition — its split photo/colour panel
  structure, the duotone treatment applied to its photography, and the
  accessibility and performance constraints that treatment must satisfy.
  Currently unowned: `projects` specifies where the projects section sits and
  `content-storage` specifies how the page is rendered, but nothing describes
  what the page looks like.

## Impact

- **`src/app/page.tsx`**: restructured into panel sections. The `UpcomingEvents`
  and `FeaturedProjects` calls, and every string on the page, are unchanged.
- **New homepage-scoped components** for the split panel. Shared primitives
  (`Container`, `Card`, `Badge`, `ButtonLink`) are not touched — this is one
  page's composition, not a component-library change.
- **`public/`**: two new image assets, downscaled from the originals
  (2000×1300 and 1584×1443, 1.4 MB combined as delivered today).
- **`src/app/globals.css`**: unchanged. No new palette tokens, no changes to
  existing ones.
- **First use of `next/image` in the codebase** — see design D5. Today
  `cover-image.tsx`, `event-card.tsx` and `gallery.tsx` all use plain `<img>`
  with a comment deferring optimisation "once the media CDN exists". These two
  are local static files, so that constraint does not apply to them.
- **Performance budget**: `lighthouserc.json` gates CLS at 0.1 (`error`) and
  warns on LCP above 2500 ms. A full-bleed hero photograph is exactly the kind of
  thing that moves both, so sizing and format are requirements here, not polish.

## Non-Goals

- **The reference site's blue/taupe palette.** Considered and declined. It would
  reverse `2026-06-26-restyle-green-design-system` (four weeks old), it cannot be
  scoped to one page without the homepage clashing with every page it links to,
  and all four of its panel colours fail WCAG AA against white text
  (2.50:1 – 3.82:1, against a 4.5:1 requirement) while CI gates accessibility at
  0.95. The photography is what the page is missing; the hue is a separate
  argument, and changing both at once would obscure which one worked.
- **Any change to `design-system`.** The palette, typography and component
  library are untouched.
- **Parallax.** The reference site uses `background-attachment: fixed`; this does
  not (design D3).
- **Restyling any other page.** Homepage only.
- **Changing any copy, heading, button label, or section title.**
- Adding photography to the events/projects card grids, or a media-library
  workflow for decorative page imagery.
