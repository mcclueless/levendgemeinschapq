## Why

The homepage currently reads as a bare listing surface: hero, upcoming events, a
lone photographic band, projects. The organisation's predecessor site
(hopehappystars.com) told a fuller story on its front page — *what we do* (three
community pillars), *who we are* (the collaborating organisations), and a
recognisable tagline — and the community wants that narrative back. This change
reshapes the homepage to that structure and, in doing so, drops the green photo
wash the community found muddying, while keeping every existing listing intact.

## What Changes

- Remove the green colour wash from the homepage's neighbourhood photographs
  (the hero photograph and the photographic band), showing them untreated.
  **BREAKING** relative to the current homepage spec, which mandates the wash.
- Add a **"Wat we doen"** section presenting the organisation's three pillars —
  Muziek & Concerten, Sociale Ontmoetingen, Tuinen & Natuur — each an image with
  its label. It occupies the mid-page slot the projecten photographic band held.
- Add a full-width tagline separator, *"Het levde is een feestje, maar je moet de
  slingers zelf ophangen"*, between the pillars and the projects section.
- Add a **"Wie we zijn"** section listing the existing organisatoren content as
  cover-image cards, each linking to its `/organisatoren/<slug>` page.
- Present the projects section in three columns on wide screens (matching the
  events grid) instead of two.
- Relocate the projecten photographic band to sit flush directly above the
  footer, and remove the hairline border that currently separates the footer
  from the section above it.

## Capabilities

### New Capabilities
<!-- None. Every change is presentational composition of the existing homepage. -->

### Modified Capabilities
- `homepage`: The photography is no longer washed with a brand tint (reversing
  the "tinted to the site palette" requirement); the page now composes
  additional narrative sections — a three-pillar "what we do" block, a tagline
  separator, and a "who we are" organiser block — so the "content and wording are
  unchanged by presentation" requirement is replaced by one that names the
  page's sections and their order; the projects photographic band moves to sit
  flush above the footer.

## Impact

- **Components**: `src/components/home/photo-panel.tsx` (drop the wash),
  `src/app/page.tsx` (recompose sections + band placement),
  `src/components/projects/project-card.tsx` (`ProjectGrid` → three columns),
  `src/components/layout/footer.tsx` (remove top border). New homepage-scoped
  components for the pillars, tagline separator, and "who we are" grid.
- **Data**: `getOrganisers()` (`src/content/repository.ts`) reused for the "who
  we are" grid; no schema or content-type change.
- **Assets**: three pillar photographs added under `public/home/`, sourced from
  the organisation's own predecessor site and self-hosted (no external image
  references, preserving the performance requirement).
- **Specs**: `homepage` spec delta only. `projects` behaviour is unchanged (the
  three-column layout is presentational and below spec granularity).
