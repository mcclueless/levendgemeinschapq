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
