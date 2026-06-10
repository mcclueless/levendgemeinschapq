## 1. Make listings dynamic

- [x] 1.1 In `src/app/agenda/page.tsx`, replace `export const revalidate = 600` with `export const dynamic = "force-dynamic"`
- [x] 1.2 Same in `src/app/locaties/page.tsx`
- [x] 1.3 Same in `src/app/organisatoren/page.tsx`
- [x] 1.4 Same in `src/app/blog/page.tsx`

## 2. Verify

- [x] 2.1 `pnpm build` succeeds and marks the four listing routes as dynamic (ƒ), not static (○)
- [x] 2.2 `pnpm typecheck` and `pnpm lint` pass
- [ ] 2.3 After deploy: publish a new organiser and confirm it appears on `/organisatoren` on the next request (no ~10-min wait); confirm response is `no-store` / not CloudFront-cached
- [ ] 2.4 Spot-check the other three listings (`/agenda`, `/locaties`, `/blog`) reflect a publish/hide immediately
- [ ] 2.5 Glance at Lighthouse CI / TTFB on the now-dynamic pages; if a regression, consider a short `revalidate` fallback
