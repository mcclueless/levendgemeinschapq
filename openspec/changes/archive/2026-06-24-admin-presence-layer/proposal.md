## Why

Today the editorial backend (`/beheer`) is a separate world: there is no way to sign in from the public site, and managing a specific item means leaving the page, navigating into the backend, and hunting it down in a list. The public site and the backend also look nearly identical, so it is not always obvious which one you are in. This change gives the single administrator a lightweight **presence layer** on the public site — sign in from the footer, and manage the item you are looking at right where you are looking at it — while making the backend unmistakably the backend.

## What Changes

- Add a **footer login entry** on every page: logged-out shows a discreet "Beheer" link to `/beheer/login`; logged-in shows "Ingelogd als beheerder · Overzicht · Uitloggen".
- Add a **contextual admin banner** on the four content-item page types (event, venue, organiser, blog post), visible only when signed in. It surfaces the management actions that already exist in the backend for that item — **Bewerken**, **Verbergen**, **Verwijderen** (events only) — plus a link to Overzicht. No inline editing; the banner only navigates and triggers existing actions.
- Introduce a shared **dark "ink" admin-chrome** visual treatment used by **both** the public banner and the `/beheer` backend top bar, so the administrator learns one signal: dark chrome = management mode. Re-skin the backend so it is clearly distinct from the public site.
- Add a non-`httpOnly` **`lg_admin` companion cookie** (set and cleared alongside the existing `lg_session`) as a client-readable hint that gates the footer state and banner without server-rendering session state into cached pages.
- Add **public-side action wrappers** for hide/delete that revalidate and return to the relevant public listing (since acting on an item makes its own page disappear), reusing the existing reference-guard so a still-referenced venue/organiser is never hidden.

## Capabilities

### New Capabilities
- `admin-presence`: The administrator's presence on the public site — footer sign-in entry and signed-in state, the contextual per-item admin banner (published-items-only, existing actions, no inline editing), the `lg_admin` client-hint cookie, the static-cache-safe client-island rendering model, and the public-side hide/delete action wrappers with reference-aware behavior.

### Modified Capabilities
- `design-system`: Add a shared dark "ink" admin-chrome token (surface, text, focus, hover states) applied to both the public admin banner and the backend top bar, establishing a single visual language for management mode distinct from the warm public palette.
- `accessibility-compliance`: The dark admin chrome must meet WCAG AA contrast on its own terms — light text on the ink surface, visible focus indicators, and hover/active states that read against the dark background.

## Impact

- **Auth**: `login()`/`logout()` in `src/app/beheer/actions.ts` also set/clear a non-`httpOnly` `lg_admin` cookie (same 7-day max-age as `lg_session`). No change to the JWT session or middleware; this remains the single-admin interim scheme.
- **Public pages**: the four content-item pages (`/agenda/[slug]`, `/locaties/[slug]`, `/organisatoren/[slug]`, `/blog/[slug]`) render a static, public-safe `<AdminBarMount>` (type, slug, title, edit href — no secrets); a new client-only banner island reads `lg_admin` and renders accordingly. Pages stay statically generated and cached (`revalidate = 600`).
- **Footer**: `src/components/layout/footer.tsx` gains a client-gated login/logout affordance.
- **Server actions**: new public-side hide/delete wrappers in the backend actions module that call the existing `setStatus`/`deleteDocument` + `findReferences` + `revalidatePublic` and redirect to the public listing.
- **Styling**: a shared ink-chrome token in the design system; the backend `AdminShell` top bar re-skinned to use it.
- **Out of scope**: multi-user auth, true inline editing, and draft preview / publishing from public pages.
