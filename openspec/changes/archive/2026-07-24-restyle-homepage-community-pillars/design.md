## Context

The homepage was last shaped by `restyle-homepage-photo-panels`, which introduced
the split photo/colour panel, the brand-green wash, and a deliberately textless
photographic band between the events and projects listings. That change locked in
two constraints this one reverses: photographs must be washed, and no wording may
be added to the page.

The organisation's predecessor site, hopehappystars.com, is the reference for this
restyle. Its homepage runs *hero → upcoming events → what we do (3 pillars) →
tagline → projects → who we are → contact*. The photographs, pillar labels and
tagline used here are the organisation's own, taken from that site.

Current homepage composition (`src/app/page.tsx`):

```
PhotoPanel(church)  →  UpcomingEvents  →  PhotoBand(projecten)  →  FeaturedProjects
```

Both `PhotoPanel` and `PhotoBand` live in `src/components/home/photo-panel.tsx`
and share a `Wash()` overlay (`bg-brand-strong/70 mix-blend-multiply` + a
gradient). `ProjectGrid` (`src/components/projects/project-card.tsx`) is
`sm:grid-cols-2`; the events grid it should match is `sm:grid-cols-2
lg:grid-cols-3` (`src/components/events/event-list.tsx`). The footer
(`src/components/layout/footer.tsx`) opens with `border-t border-border`.

## Goals / Non-Goals

**Goals:**
- Recompose the homepage to the predecessor site's narrative order.
- Show the neighbourhood photographs untreated (no green wash).
- Add three new homepage-scoped sections: the three pillars, the tagline
  separator, and the "who we are" organiser grid — reusing existing data and UI
  primitives (`getOrganisers`, `CoverImage`, `Card`, `Container`,
  `SectionHeading`) wherever they fit.
- Keep the existing listings (upcoming events, featured projects) and the hero
  wording exactly as they are.

**Non-Goals:**
- No new content type, schema, or CMS surface — "who we are" reads the existing
  organisatoren content.
- No palette or design-token changes; sections use existing tokens.
- No change to the events grid or any non-homepage page.
- Pillars are static image+label tiles; they are not links in this change.

## Decisions

### D1 — Delete the wash, keep the two photo components
`Wash()` is removed and both `PhotoPanel` (hero) and `PhotoBand` render their
`next/image` untreated. The hero keeps its adjacent flat `bg-brand-strong` colour
panel, so the hero heading/CTA contrast is still a property of the token pair
(white on brand-strong), unaffected by dropping the wash. *Alternative:* make the
wash opt-in via a prop — rejected; nothing wants it anymore, so it is dead weight.

### D2 — Pillars as a new homepage-scoped component, labels on a scrim
A new `Pillars` component renders three image tiles, each with its label
(Muziek & Concerten / Sociale Ontmoetingen / Tuinen & Natuur). Labels sit on a
deterministic dark scrim over the image (a solid/gradient bar), never free over
raw pixels, so the homepage contrast requirement holds regardless of the
photograph. Grid is `sm:grid-cols-3` (three abreast on all but the narrowest
screens), mirroring the events/projects rhythm. Homepage-scoped, not added to the
shared library until a second page needs it.

### D3 — Self-host the pillar photographs
The three images are downloaded from the predecessor site, converted to `.webp`,
and committed under `public/home/` (e.g. `pillar-muziek.webp`,
`pillar-ontmoeting.webp`, `pillar-natuur.webp`), then imported as static assets so
Next stamps intrinsic dimensions (no layout shift) — the same treatment as the
existing `church`/`projecten` imports. This preserves the homepage performance and
"self-hosted, no predecessor-site references" requirement. *Alternative:*
hotlink from the old site — rejected; violates that requirement and the CLS
budget.

### D4 — Relocate the band, don't duplicate it
The single `PhotoBand` instance (`projecten.webp`) moves from between the two
listings to directly above `<Footer>`, rendered flush (no vertical gap) with the
footer's `border-t` removed, so the photograph reads as a graceful lead-in to the
footer. The pillars section takes the mid-page slot the band vacated.

### D5 — Tagline separator as a flat full-width band
A new `TaglineBand` renders *"Het levde is een feestje, maar je moet de slingers
zelf ophangen"* as a single full-width line on a flat brand background, placed
between the pillars and the projects section (as on the reference site). Existing
tokens only.

### D6 — "Who we are" reuses organiser data and the card primitive
A new `WhoWeAre` async section calls `getOrganisers()` and renders each as a
cover-image-only `Card` linking to `organiser.href`. Image-only per the request —
no name/excerpt text inside the card. An empty state renders nothing rather than
an error, consistent with the other self-resolving sections.

### D7 — Three-column projects via one class
`ProjectGrid` gains `lg:grid-cols-3` so its wrapper becomes `grid gap-6
sm:grid-cols-2 lg:grid-cols-3`, byte-for-byte the events grid. This also affects
the `/projecten` overview, which shares `ProjectGrid` — a welcome consistency, not
a regression, and below spec granularity.

## Risks / Trade-offs

- **Pillar label contrast depends on the scrim, not the wash** → the scrim is a
  fixed dark overlay/gradient behind the label text with a checked contrast ratio,
  so legibility never rides on the underlying photograph (D2).
- **Predecessor-site image quality/licensing** → images are the organisation's
  own; they are self-hosted and re-encoded, and no external reference remains
  (D3). If an original is too low-res, it is swapped for a neighbourhood photo of
  the same subject rather than upscaled.
- **`ProjectGrid` is shared with `/projecten`** → the three-column change lands
  there too; verified as intended, and the page already expects a responsive grid
  (D7).
- **Removing the wash touches a spec requirement** → handled by the `homepage`
  spec delta (removing the tint requirement, replacing the wording-frozen
  requirement); not a silent behavioural drift.
