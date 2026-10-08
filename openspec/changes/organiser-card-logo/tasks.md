# Tasks

## 1. The rule (D1)

- [x] 1.1 Add `organiserCardImage(data)` to `src/content/organiser-images.ts`,
      returning `{ kind: "logo", src }`, `{ kind: "cover", src }` or
      `{ kind: "name" }` from `logo`, then `featuredImage`, then nothing.
      Test in `organiser-images.test.ts`: logo plus cover gives the logo; cover
      only gives the cover; neither gives name; an empty-string logo counts as
      absent. `pnpm test` passes.

## 2. The component (D2, D3)

- [x] 2.1 Build `src/components/content/organiser-card-image.tsx`: takes an
      organiser (`logo`, `featuredImage`, `name`) and a height class; renders a
      padded `bg-surface-2` panel with the logo `object-contain` and the name
      as alt via `DescribedImage`, or `CoverImage` for a cover, or the brand
      name panel. Verify with `pnpm typecheck` and `pnpm lint`.

## 3. The two pages (D3, D4)

- [x] 3.1 Use the component in `src/app/organisatoren/page.tsx` with `h-44`,
      replacing the `CoverImage` call. Verify in the app: an organiser with a
      logo shows it whole on a neutral panel; one with only a cover is
      unchanged; one with neither shows its name on the brand panel.
- [x] 3.2 Use the component in `src/components/home/who-we-are.tsx` with
      `h-56`, replacing the inline cover/name branches. Verify in the app that
      the same organiser shows the same image on the homepage and the overview,
      and that the homepage still renders with no organisers.

## 4. Verify

- [x] 4.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [x] 4.2 In the app, give one organiser a wide logo and one a square logo and
      check both cards at phone and desktop width: no cropping, equal card
      heights, the logo not touching the edges. Open that organiser's page and
      confirm the logo beside the name and the slideshow are as before. Restore
      any content files the checks changed.

## 5. Revision: a 16:9 image area for logos (D2, D3 revised 2026-10-08)

- [ ] 5.1 In `organiser-card-image.tsx`, give all three outcomes an
      `aspect-video` image area and drop the `heightClass` prop; render the
      logo on a white panel without padding, still `object-contain`. Remove the
      `heightClass` arguments in `src/app/organisatoren/page.tsx` and
      `src/components/home/who-we-are.tsx`. Verify with `pnpm typecheck` and
      `pnpm lint`.
- [ ] 5.2 In the app, at desktop and phone width, on the overview and the
      homepage: a 16:9 logo with a white background (Thee-Resia's file) fills
      the image area edge to edge; a transparent square logo shows whole and
      centred; a cover and the name panel have the same 16:9 area; cards in a
      row line up. Restore any content files the checks changed.
- [ ] 5.3 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [ ] 5.4 After deploy, check Thee-Resia Samentuin on goeddoen.net's
      organisers overview and homepage alongside Athos and VIND.
