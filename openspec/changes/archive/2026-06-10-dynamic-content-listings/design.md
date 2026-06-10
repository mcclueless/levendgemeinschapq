## Context

community-event-calendar D4 chose **time-based ISR (600s)** as the load-bearing freshness mechanism, with on-demand `revalidatePath()` as a best-effort speed-up. The reasoning: read-heavy, write-light workload favours a bounded freshness budget over precise push-based invalidation, and it is robust on a CDN we don't own (Amplify's managed CloudFront). That holds well for detail pages.

It does **not** hold for the listing pages from an editor's point of view. Verified on the live site: `organisers/vind.mdx` was in S3 with `status: published`, yet `/organisatoren` served edge-cached copies without it. Response headers: `cache-control: s-maxage=600, stale-while-revalidate=…`, `x-cache: Hit from cloudfront`. Because `CLOUDFRONT_DISTRIBUTION_ID` is intentionally unset on Amplify, the publish-time `revalidatePath()` cannot purge the edge, so the listing only converges after the window — and is inconsistent edge-to-edge during it.

## Goals / Non-Goals

**Goal:** create / publish / edit / hide / delete is reflected on the four listing pages immediately, on every request, from every edge.

**Non-goals:** changing detail/static caching; building CDN purge; the homepage preview.

## Decision

Make the four listing pages **`dynamic = "force-dynamic"`** — server-rendered per request, reading S3 live, served `no-store` so CloudFront does not cache them. This revises D4 *for index pages only*: their freshness budget drops from 600s to zero.

**Why dynamic over a shorter window (option A, `revalidate = 60`):** a shorter window narrows the lag but keeps the same edge-inconsistency failure mode (some edges stale, some fresh) and still isn't "immediate." The complaint is specifically that publishing looks broken; only per-request rendering removes the ambiguity. The cost that made A attractive — origin/S3 load — is negligible here: four low-cardinality index pages on a low-traffic site.

**Why not on-demand CDN purge (option C):** Amplify manages its own CloudFront and does not expose a distribution id to invalidate, so there is no reliable purge hook. This is why D4 made on-demand revalidation non-load-bearing in the first place.

**Scope to listings, not details:** detail pages are the bulk of the crawlable/cacheable surface and are reached *after* the listing already showed the item, so they keep ISR. A just-published item's detail page renders on demand via `dynamicParams` anyway.

## Risks / Trade-offs

- **Origin load / TTFB:** every listing hit is SSR + an S3 `ListObjectsV2` + per-document reads (already wrapped in React `cache()` per request). Acceptable at current scale; if traffic grows, reintroduce a short `revalidate` (e.g. 30–60s) as a middle ground.
- **Lighthouse/CWV budget:** dynamic pages aren't prerendered, but emit the same small HTML; watch TTFB after deploy. The Lighthouse CI gate runs on build output — confirm it still targets representative pages.
- **Loss of static resilience:** if S3 is briefly unavailable, a dynamic listing errors rather than serving a stale cache. Low likelihood; detail/static pages remain cached.

## Migration

None. Pure rendering-mode change; no data, schema, or storage changes. Reversible by restoring `export const revalidate = <n>`.
