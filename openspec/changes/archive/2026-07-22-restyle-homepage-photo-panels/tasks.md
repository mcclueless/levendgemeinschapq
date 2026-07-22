## 1. Assets

- [x] 1.1 Download `Sint-Theresiakerk-2.jpg` (2000×1300) and `Projects.jpg` (1584×1443) from the organisation's existing site — its own photography, no licensing issue (design D4)
- [x] 1.2 Downscale and re-encode both before committing; as delivered they are 621 KB and 763 KB, and 1.4 MB of decorative imagery would consume most of the performance budget
- [x] 1.3 Commit them under `public/` with descriptive filenames. Do **not** hotlink the predecessor site: `remotePatterns` permits only the S3 media bucket, and hotlinking would couple this homepage to the site it replaces (design D4)

## 2. Panel component

- [x] 2.1 Build a homepage-scoped split-panel component pairing a photograph with a flat colour panel. Do not touch `Container`, `Card`, `Badge` or `ButtonLink` — one page's device does not belong in the shared library yet (design D8)
- [x] 2.2 Apply the duotone wash using `--color-brand-strong`, not a new colour. No new palette tokens, and `globals.css` is not modified (design D1)
- [x] 2.3 Render photographs with `next/image` from local static imports — the first use in this codebase, and deliberately narrow. The existing plain-`<img>` comments in `cover-image.tsx` / `event-card.tsx` / `gallery.tsx` concern *remote content* images awaiting the media CDN, which does not apply to local static files (design D5)
- [x] 2.4 Set `priority` on the hero image; leave the projects image lazy
- [x] 2.5 Set per-image crop origins: church `50% 50%`, projects `0% 50%` — the near-square projects image has its subject left of centre and centre-cropping would cut it (design D6)
- [x] 2.6 Place text on the flat panel, not over the photograph. Where any text must overlap imagery, add a scrim so contrast is deterministic rather than dependent on the photo's luminance (design D2)
- [x] 2.7 Do **not** use `background-attachment: fixed`. No parallax: iOS jank, it forfeits `srcset`/modern formats, and no reduced-motion policy exists in the specs to hang motion on (design D3)

## 3. Homepage composition

- [x] 3.1 Restructure `src/app/page.tsx` around the panels: hero panel with the church photograph, projects panel with the projects photograph
- [x] 3.2 Add alternating bands between sections using existing surface tokens
- [x] 3.3 Keep `export const dynamic = "force-dynamic"` and the `JsonLd` block untouched — the homepage renders per request by `content-storage` requirement
- [x] 3.4 Keep `UpcomingEvents` and `FeaturedProjects` calls unmodified, including `limit`, `variant`, `title`, `subtitle` and `emptyLabel` (design D7)
- [x] 3.5 Verify with `git diff` that **no string on the page changed** — any copy diff in this change is a mistake (design D7)

## 4. Verification

- [x] 4.1 View the homepage at desktop and mobile widths; confirm no horizontal overflow and no text obscured by imagery
- [x] 4.2 Judge the green wash against the real photographs by eye — if it reads muddy, adjust opacity or move to a shadow-tinted duotone rather than reaching for a different palette (design "Risks")
- [x] 4.3 Confirm each photograph's subject survives its crop at several viewport widths (design D6)
- [x] 4.4 Check contrast of every text/background pairing on the page, including any text near imagery, against AA (4.5:1 normal text)
- [x] 4.5 Run the Lighthouse config (`lighthouserc.json`) against the homepage: accessibility ≥ 0.95 is an `error` gate; confirm CLS ≤ 0.1 and note the LCP figure
- [x] 4.6 Confirm the two images are served from `public/`, in a modern format, at sensible transferred sizes — and that no request goes to the predecessor site
- [x] 4.7 Confirm `/agenda`, `/projecten`, `/blog`, `/locaties`, `/organisatoren` and `/beheer` are visually unchanged — the palette and shared components must not have moved
- [x] 4.8 Confirm the upcoming-events and projects sections still list the same items with the same limits, and that both empty states still render
- [x] 4.9 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`
