## 1. Layout (D1, D2)

- [ ] 1.1 In `src/app/blog/page.tsx`, make each card a stacked layout below
      `md` and a two-column grid from `md` (cover about two fifths, text
      centred); give `CoverImage` `aspect-video` instead of `h-56`. Verify with
      `pnpm typecheck` and `pnpm lint`.

## 2. Verify

- [ ] 2.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [ ] 2.2 In the app at 375, 768, 1024 and 1280 px: a 16:9 cover is shown whole
      (box ratio 1.78); a post without a cover shows the default cover; order
      is newest first; no horizontal scrolling.
- [ ] 2.3 After deploy, measure the blog card cover box on goeddoen.net at
      1280 px and confirm a 16:9 ratio.
