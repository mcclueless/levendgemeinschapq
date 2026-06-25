## 1. Make the homepage render per request

- [x] 1.1 In `src/app/page.tsx`, replace `export const revalidate = 600` with `export const dynamic = "force-dynamic"`, with a comment matching the listing pages' rationale ("reads S3 live so a publish/edit/hide/delete shows on the next request, with no CDN-cache lag").

## 2. Verification

- [x] 2.1 `npm run typecheck` and `npm run lint` clean.
- [x] 2.2 Locally: confirm the homepage upcoming-events preview reflects a hide/delete on the next request (no stale item).
- [x] 2.3 After deploy: confirm on prod that a removed/hidden upcoming event no longer appears on the homepage, matching `/agenda`.
