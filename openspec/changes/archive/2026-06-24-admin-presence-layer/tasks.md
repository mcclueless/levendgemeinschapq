## 1. Shared admin chrome (design system)

- [x] 1.1 Add a dark "ink" admin-chrome token to the design system (surface, text, focus-ring, hover/active), verifying WCAG AA contrast on the ink surface
- [x] 1.2 Re-skin the backend top bar (`AdminShell`) to use the shared ink chrome so the backend is unmistakably distinct from the public site
- [x] 1.3 Verify keyboard focus and hover/active states are perceivable on the dark chrome

## 2. Session hint cookie

- [x] 2.1 Set a non-`httpOnly` `lg_admin=1` cookie in `login()` alongside `lg_session`, with the same 7-day max-age and path
- [x] 2.2 Clear `lg_admin` in `logout()` alongside `lg_session`
- [x] 2.3 Add a small client helper to read the `lg_admin` hint from `document.cookie`

## 3. Footer sign-in / signed-in state

- [x] 3.1 Add a client-gated affordance to the footer: signed-out shows a discreet "Beheer" link to `/beheer/login`
- [x] 3.2 Signed-in shows "Ingelogd als beheerder · Overzicht · Uitloggen" (Uitloggen triggers the existing `logout` action)
- [x] 3.3 Confirm the footer renders identical static markup for all users and reveals signed-in state only on the client

## 4. Contextual admin banner

- [x] 4.1 Create a static, public-safe `<AdminBarMount type slug title editHref />` (labels/URLs only, no secrets)
- [x] 4.2 Render `<AdminBarMount>` on the four content-item pages: `/agenda/[slug]`, `/locaties/[slug]`, `/organisatoren/[slug]`, `/blog/[slug]`
- [x] 4.3 Build the client-only banner island: read the `lg_admin` hint and the mount context; render the ink banner or `null`
- [x] 4.4 Banner actions: Bewerken (link to the item's backend edit form), Verbergen, link to Overzicht, and Verwijderen for events only
- [x] 4.5 Ensure the banner is absent on non-item pages (home, listings, static) while the footer state still works

## 5. Public-side action wrappers

- [x] 5.1 Add a public-side hide wrapper: re-check `isAdmin()`, reuse `findReferences` guard, `setStatus` → draft, `revalidatePublic`, redirect to the public listing with a confirmation
- [x] 5.2 Add a public-side event-delete wrapper: re-check `isAdmin()`, `deleteDocument`, `revalidatePublic`, redirect to the public events listing with a confirmation
- [x] 5.3 Reference-block outcome: hide of a still-referenced venue/organiser redirects to the backend list (`?blocked=`), whose existing UI names the referencing published items — mirroring the backend reference guard (DRY; rule stays in one place)
- [x] 5.4 Add confirmation prompts for Verbergen and Verwijderen on the banner (reuse the existing confirm pattern)

## 6. Verification

- [x] 6.1 Verify anonymous markup on content-item pages contains no admin UI and pages stay statically cached (`revalidate = 600`)
- [x] 6.2 Verify a stale `lg_admin` hint with an expired session fails safe (banner action bounces to `/beheer/login`)
- [x] 6.3 Verify hide/delete from a page lands on the correct public listing with a confirmation, and that hiding a referenced venue/organiser is blocked
- [x] 6.4 Run typecheck and lint (`npm run typecheck`, `npm run lint`)
