## Why

Newly published (or edited/hidden/deleted) content does not appear on the public **listing** pages — `/agenda`, `/locaties`, `/organisatoren`, `/blog` — until the time-based freshness window elapses (~10 minutes). The pages are ISR-cached (`revalidate = 600`) behind Amplify's managed CloudFront (`s-maxage=600, stale-while-revalidate`). On-demand `revalidatePath()` on publish **cannot purge that CloudFront cache** — by design `CLOUDFRONT_DISTRIBUTION_ID` is unset on Amplify (community-event-calendar D4) — so during the window different edge requests return either the stale page (missing the new item) or a freshly regenerated one. An editor published an organisation ("VIND") and it was absent from `/organisatoren`; the document was correctly in S3 with `status: published` the whole time. The data path is fine; the **freshness window on the listing pages is the problem**, and it reads as "publishing is broken."

## What Changes

- Render the four public **listing** pages per-request (dynamic SSR) instead of ISR-cached, so create / edit / publish / hide / delete reflect **immediately**:
  - `/agenda` (events), `/locaties` (venues), `/organisatoren` (organisers), `/blog` (blog posts).
- Each becomes `export const dynamic = "force-dynamic"` (replacing `export const revalidate = 600`); the page reads S3 live on every request and is served with no-store, so CloudFront does not cache it.
- **Detail pages and all other content keep their existing ISR/CDN caching** — they are the bulk of the crawl/traffic surface and are not where the editor-freshness complaint lands.

## Capabilities

### Modified Capabilities
- `content-storage`: The caching/invalidation policy now distinguishes **index/listing pages** (rendered per-request for immediate freshness) from **detail and static pages** (cached/CDN with time-based revalidation).

## Non-goals

- **Changing detail-page or static-page caching.** Only the four listing pages become dynamic; everything else keeps ISR.
- **On-demand CDN invalidation on publish.** The "correct" instant-publish-everywhere fix needs to purge Amplify's managed CloudFront, which Amplify does not expose; out of scope.
- **The homepage upcoming-events preview.** Could follow the same pattern later, but is not part of this change.

## Impact

- **Affected code (4 one-line edits):** `src/app/{agenda,locaties,organisatoren,blog}/page.tsx` — swap `export const revalidate = 600` for `export const dynamic = "force-dynamic"`.
- **Trade-off:** each listing request now hits the SSR compute and one S3 `ListObjectsV2` (+ a read per document) instead of a cached edge response. For this read-light, low-traffic neighbourhood site that is acceptable; listings are low-cardinality and cheap to render. Listings lose CDN caching (slightly higher TTFB); detail pages stay cached.
- **Build:** dynamic pages are skipped during prerender, so the build no longer reads the git seed for these four routes — removing one build/runtime divergence for them.
- **Watch:** Lighthouse CI / Core Web Vitals on the now-dynamic pages (HTML is unchanged and small, so the budget should hold, but TTFB is worth a glance after deploy).
