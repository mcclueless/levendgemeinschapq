## Why

An editor deleted the event "Repair Café" in production. It disappeared immediately from the admin dashboard and the `/agenda` listing — but stayed visible on the **homepage**. The homepage is the one public surface that shows live event content yet is still served from cache (`export const revalidate = 600`), while the admin and all listing pages render per request. The delete does call `revalidatePath("/")`, but on Amplify that doesn't reliably purge the served page (no `CLOUDFRONT_DISTRIBUTION_ID` is configured, so the app's CDN-invalidation step is a no-op). The result is stale, deleted content on the most visited page.

## What Changes

- Render the **homepage per request** (read the source of truth live), exactly like the agenda/venues/organisers/blog listing pages already do, so a publish/edit/hide/delete is reflected on the next request with no CDN-cache lag.
- Amend the caching policy so that **any page surfacing live content listings — including the homepage — is in the render-per-request set**, not the cached-static set.

## Capabilities

### Modified Capabilities
- `content-storage`: Update the "Caching and invalidation policy" requirement so the homepage (and any page that surfaces live content listings) is rendered per request from the source of truth, alongside the index/listing pages. Genuinely static pages and content detail pages remain cached-and-revalidated as before.

## Impact

- **Homepage** (`src/app/page.tsx`): replace `export const revalidate = 600` with `export const dynamic = "force-dynamic"` (with a comment matching the listing pages' rationale). Its `<UpcomingEvents>` preview then reads S3 live each request.
- No data, schema, or component changes. `<UpcomingEvents>` already resolves its own data.
- **Out of scope** (deferred, deliberate follow-up): the four `[slug]` detail pages (`/agenda/[slug]`, `/locaties/[slug]`, `/organisatoren/[slug]`, `/blog/[slug]`) share the same ISR (`revalidate = 600`) pattern and the same latent staleness on their direct URLs after a hide/delete; converting them trades static performance for freshness and should be decided separately. Configuring CloudFront invalidation is also out of scope — Amplify manages its own CDN, and rendering per request is the reliable fix.
