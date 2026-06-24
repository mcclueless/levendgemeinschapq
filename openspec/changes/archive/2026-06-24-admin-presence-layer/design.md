## Context

The site runs the interim single-admin auth scheme (design D6): a single administrator signs in with an env password (`ADMIN_PASSWORD`), and the server issues a signed JWT session cookie `lg_session` (`jose`, edge-safe). `src/middleware.ts` protects everything under `/beheer`; `isAdmin()`/`requireAdmin()` in `src/lib/auth-server.ts` gate server logic. Multi-user auth is deferred.

Public content-item pages — `/agenda/[slug]`, `/locaties/[slug]`, `/organisatoren/[slug]`, `/blog/[slug]` — are **statically generated and cached** (`revalidate = 600`) and fetch only published items. The backend lives under `/beheer`, wrapped in `AdminShell`, and is `force-dynamic`. The public footer (`src/components/layout/footer.tsx`) and header are shared chrome; there is no sign-in entry on the public site, and the backend looks almost identical to the public site.

Per-item management already exists in the backend: `Bewerken` (edit form at `/beheer/{segment}/{slug}/bewerken`), `Verbergen` (`hideContent` → status `draft`, guarded by `findReferences`), `Publiceren` (`showContent`), and `Verwijderen` (`deleteEvent`, events only). These server actions live in `src/app/beheer/actions.ts` and end with `redirect(adminListPath(...))`.

## Goals / Non-Goals

**Goals:**
- Let the administrator sign in from the public footer and see signed-in state there.
- Surface each item's existing backend actions on its own public page, for signed-in admins only.
- Make the backend visually unmistakable via a shared dark "ink" admin-chrome shared with the public banner.
- Keep public pages fully static and cacheable — no per-user rendering, no cache poisoning.

**Non-Goals:**
- Multi-user auth or roles (still deferred).
- True inline editing of page content.
- Draft preview or publishing from public pages (publishing stays backend-only).

## Decisions

### D1 — Split *context* (static, public-safe) from *visibility* (client-gated)
Content-item pages render a static `<AdminBarMount type slug title editHref />`. These are just labels and URLs — already-public, no secrets — so the cached HTML is identical for everyone. A **client-only** banner island hydrates, reads the session hint, and renders the banner or `null`.
- *Alternative rejected:* server-render the banner from the session cookie. This poisons the shared cache (every visitor gets the admin's HTML, or no one does) or forces the page dynamic, killing caching for the public. Unacceptable.

### D2 — `lg_admin` companion cookie as the client hint
`login()` sets a non-`httpOnly` `lg_admin=1` cookie alongside `lg_session`; `logout()` clears both. Same 7-day max-age. The client reads `document.cookie` to decide whether to reveal the footer signed-in state and the banner — **zero extra requests**, no hydration fetch.
- *Alternative considered:* a `/api/me` endpoint the island fetches per page load. Correct but adds a request to every page; the hint cookie is simpler and also powers the footer state. The hint is **only a hint** — never proof of authorization (see D4).

### D3 — One shared dark "ink" admin-chrome token
Define an ink admin-chrome treatment (surface, text, focus, hover) in the design system and apply it to both the public banner and the backend top bar (`AdminShell`). The administrator learns one signal: dark chrome = management mode. The backend re-skin makes "you are in the backend" unmistakable. The dark surface needs its own WCAG-AA contrast pairing (light text, focus rings, hover states that read against ink) — captured in the accessibility-compliance delta.

### D4 — Security stays server-side; the hint can fail safe
Every banner action targets `/beheer/...` (middleware-protected) or a server action that re-checks `isAdmin()`. The `lg_admin` hint never grants access. If the hint lingers after the session expires, the worst case is a banner that shows; clicking through bounces to `/beheer/login`. No secret is ever placed in page markup.

### D5 — Public-side action wrappers that return to the listing
The existing `hideContent`/`deleteEvent` redirect into the backend. Acting on an item from its own page makes that page disappear, so add **thin new public-side wrappers** that re-check admin, call the same `setStatus`/`deleteDocument` + `revalidatePublic`, and `redirect` to the item's **public listing** (`/agenda`, `/locaties`, `/organisatoren`, `/blog`) with a confirmation flag. For hide, reuse `findReferences`: a still-referenced venue/organiser is not hidden and the admin is shown the blocking published items — the reference rule (design D3 of the original change) stays in one place.

## Risks / Trade-offs

- **Hydration delay for admins** → The banner is client-only, so admins see the page paint and then the bar appears a beat later. Accepted; this is the standard admin-bar trade-off and anonymous visitors see zero flash.
- **Hint/session drift** → `lg_admin` can outlive `lg_session` (e.g. session expiry). Mitigated by D4: actions re-check server-side and fail safe to login; the hint controls only UI reveal.
- **Cache correctness** → If any session-dependent output leaked into the static markup, caches would be poisoned. Mitigated by D1: only non-secret context is embedded; the reveal decision is purely client-side. Worth an explicit test that anonymous markup contains no admin UI.
- **Contrast regressions on dark chrome** → A dark surface dropped into a warm light palette can fail AA if reused tokens assume a light background. Mitigated by the accessibility-compliance delta and verifying contrast/focus on the ink surface specifically.
- **Action wrapper divergence** → New public-side wrappers could drift from backend behavior. Mitigated by reusing the same underlying functions (`setStatus`, `deleteDocument`, `findReferences`, `revalidatePublic`) rather than reimplementing rules.

## Migration Plan

Additive and incremental; no data or schema changes.
1. Add the ink admin-chrome token to the design system; re-skin `AdminShell` to use it.
2. Set/clear `lg_admin` in `login()`/`logout()`.
3. Add the footer client-gated sign-in/sign-out affordance.
4. Add `<AdminBarMount>` to the four content-item pages and the client banner island.
5. Add the public-side hide/delete action wrappers and wire the banner to them.

Rollback: remove the banner island, mount, footer affordance, and wrappers; clearing `lg_admin` has no server-side effect. The interim auth and backend are untouched.

## Open Questions

- None blocking. Exact ink palette values and focus-ring styling to be finalized against the existing design tokens during implementation, constrained by the accessibility-compliance delta.
