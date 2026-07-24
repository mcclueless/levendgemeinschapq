## 1. Remove the green wash

- [x] 1.1 Delete the `Wash` component from `src/components/home/photo-panel.tsx` and remove its use inside `PhotoPanel` (hero photo) and `PhotoBand`
- [x] 1.2 Confirm the hero's flat `bg-brand-strong` colour panel and white text are untouched (contrast unchanged)

## 2. Pillar photographs (assets)

- [x] 2.1 Download the three predecessor-site images (`fanfare_orkest.jpg`, `Burendag-2023-Plein-Publique-121.jpg`, `Bronprocessie.jpg`) and convert to `.webp`
- [x] 2.2 Commit them under `public/home/` as `pillar-muziek.webp`, `pillar-ontmoeting.webp`, `pillar-natuur.webp` (self-hosted; no external references)

## 3. New homepage sections

- [x] 3.1 Add a homepage-scoped `Pillars` component: three `sm:grid-cols-3` image tiles labelled Muziek & Concerten / Sociale Ontmoetingen / Tuinen & Natuur, each label on a deterministic dark scrim over the image (design D2)
- [x] 3.2 Add a `TaglineBand` component rendering "Het levde is een feestje, maar je moet de slingers zelf ophangen" as a flat full-width separator using existing tokens (design D5)
- [x] 3.3 Add an async `WhoWeAre` section that calls `getOrganisers()` and renders each as a cover-image-only `Card` linking to `organiser.href`; render nothing when there are no organisers (design D6) — NOTE: seed organisers have no cover image, so a name-card fallback shows until covers are added (open decision below)

## 4. Recompose the page

- [x] 4.1 In `src/app/page.tsx`, replace the mid-page `PhotoBand` with the `Pillars` section
- [x] 4.2 Insert `TaglineBand` between `Pillars` and `FeaturedProjects`
- [x] 4.3 Insert `WhoWeAre` after `FeaturedProjects`
- [x] 4.4 Move the `PhotoBand` (projecten image) to render flush directly above the footer
- [x] 4.5 Confirm final section order: intro → upcoming events → pillars → tagline → projects → who we are → photo band → footer

## 5. Grid and footer tweaks

- [x] 5.1 Add `lg:grid-cols-3` to `ProjectGrid` in `src/components/projects/project-card.tsx` (matching `EventList`)
- [x] 5.2 Remove `border-t border-border` from the `<footer>` in `src/components/layout/footer.tsx` so the band above it reads flush (also dropped `mt-20` so there is no canvas gap; affects all pages' footer spacing)

## 6. Verify

- [x] 6.1 Load the homepage on the running dev server; visually confirm the six changes and the section order
- [x] 6.2 Check narrow-screen layout (no horizontal overflow; pillar labels legible over their scrim)
- [x] 6.3 Run `pnpm typecheck` and `pnpm lint`
- [ ] 6.4 Confirm the Lighthouse/accessibility checks still pass (CI runs a production build; not run locally to avoid clobbering the dev server). Contrast is satisfied by the scrim; images carry intrinsic dimensions (no CLS)
- [x] 6.5 Run `openspec validate restyle-homepage-community-pillars`
