## Context

On Amplify, the team converted the public **listing** pages (`/agenda`, `/locaties`, `/organisatoren`, `/blog`) to `export const dynamic = "force-dynamic"` so content changes show with "no CDN-cache lag" (their words, in the page comments). The **homepage** (`src/app/page.tsx`) was left on ISR (`export const revalidate = 600`); its `<UpcomingEvents>` server component resolves its own data via `getUpcomingEvents`, but that read is frozen into the cached snapshot. Deletes call `revalidatePath("/")`, but prod has no `CLOUDFRONT_DISTRIBUTION_ID`, so `invalidateCdn` is a no-op and Amplify keeps serving the cached homepage — observed live as a deleted event ("Repair Café") lingering on the homepage while gone from admin and `/agenda`.

## Goals / Non-Goals

**Goals:**
- The homepage reflects publish/edit/hide/delete on the next request, like the listings.
- Bring the spec's caching policy in line: pages surfacing live listings render per request.

**Non-Goals:**
- Converting the `[slug]` detail pages (separate freshness-vs-static-perf decision).
- Configuring CloudFront invalidation (Amplify manages its own CDN; per-request rendering is the reliable fix).
- Any data/schema/component change.

## Decisions

### D1 — Make the homepage `force-dynamic`, matching the listings
Replace `export const revalidate = 600` with `export const dynamic = "force-dynamic"` in `src/app/page.tsx`, with a comment mirroring the listing pages. This is the proven pattern in this codebase for Amplify freshness; it sidesteps the unreliable ISR-revalidate + CDN-invalidation path entirely.
- *Alternatives rejected:* (a) lower `revalidate` — still cached, still stale up to the window and the CDN TTL; (b) wire up CloudFront invalidation — Amplify owns the CDN and doesn't hand out an invalidatable distribution id; fragile and out of step with how listings were solved.

### D2 — Reclassify the homepage in the caching spec
The spec previously lumped the homepage under "static pages" (cached + revalidated). It actually surfaces live content, so the requirement now groups it with the listing pages in the render-per-request set. Detail and genuinely-static pages keep the cached-and-revalidated policy.

## Risks / Trade-offs

- **Per-request render cost on the most-visited page** → The homepage now reads S3 each request. Mitigation: it's a small upcoming-events preview using the same `getUpcomingEvents` path the always-dynamic `/agenda` already serves; load is comparable, reads are cheap, and writes are rare.
- **Detail pages still stale after hide/delete on their direct URL** → Out of scope here; the homepage was the reported, high-visibility symptom. Flagged for a deliberate follow-up.

## Migration Plan

1. Edit `src/app/page.tsx`: swap the `revalidate` export for `dynamic = "force-dynamic"`.
2. Deploy; verify on prod that a hidden/removed upcoming event drops off the homepage on the next request.

Rollback: restore `export const revalidate = 600`.

## Open Questions

- None blocking. Whether to also convert the `[slug]` detail pages is a separate decision, intentionally not bundled here.
