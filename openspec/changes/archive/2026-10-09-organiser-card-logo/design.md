## Context

See proposal.md for the motivation. What shapes the approach:

- Two places render an organiser card: `src/app/organisatoren/page.tsx` and `src/components/home/who-we-are.tsx`. Both use `CoverImage` with `organiser.featuredImage` and `object-cover` in a fixed-height box (h-44 on the overview, h-56 on the homepage). The homepage already has a name-on-brand-panel fallback; the overview renders no image area at all when there is no cover.
- The organiser record (`src/content/types.ts`) already carries `logo`, `featuredImage` and `images`; nothing needs loading or storing.
- The organiser's own page renders the logo with `object-contain`, a max height and the organiser's name as alt text. Its JSON-LD uses the logo and the cover separately; neither changes.
- `DescribedImage` looks up an editor-written description for an image and falls back to the given alt; `CoverImage` wraps it.
- Tests in this repo are `node:test` on pure functions; there are no component tests.

## Goals / Non-Goals

**Goals:**
- One decision, one place: which image a card shows is a pure function, and one component renders all three outcomes.
- The overview and the homepage cannot drift apart.
- Logos are never cropped; photos keep filling the box as today.

**Non-Goals:**
- Changing the organiser's own page, share previews or structured data.
- A logo field for venues, projects or other types.
- Any change to how logos are uploaded or stored.

## Decisions

### D1 — A pure chooser, then one component
Add `organiserCardImage(organiser)` to `src/content/organiser-images.ts`, returning `{ kind: "logo", src } | { kind: "cover", src } | { kind: "name" }` from `logo`, then `featuredImage`, then nothing. A new `OrganiserCardImage` component in `src/components/content/` takes the organiser and a height class and renders the three outcomes.

- *Why a pure function:* the rule is the whole feature; a unit test pins the chain without rendering. It matches how this repo tests (`organiser-images.test.ts` already covers the sibling helpers).
- *Why one component:* the proposal's point is that both pages look the same. Two inline ternaries would drift at the first styling tweak.
- *Alternative rejected:* extend `CoverImage` with a `fit` prop. It is shared by venues and blog posts, which never show a logo, and the name panel is not an image at all.

### D2 — How each outcome renders (revised 2026-10-08)
- **Logo:** a white panel (`bg-surface`) filling the card's 16:9 image area, no padding, the logo inside with `max-h-full max-w-full object-contain`, centred. Alt text is the organiser's name via `DescribedImage`, so an editor-written description still wins, exactly as on the organiser's page.
- **Cover:** the existing `CoverImage` with `object-cover`, unchanged.
- **Name:** the homepage's existing brand panel (`bg-brand-strong`, display font, white text) moved into the component so the overview gets it too.

- *Why white and unpadded, replacing the first version's grey padded panel:* the first version assumed a logo is a bare mark with a transparent background. In practice editors follow the team's rule of 29 September 2026 — every image exported at 16:9 before upload — so a logo arrives as a 16:9 card with its own white background. On the grey padded panel that showed as a small white box, inconsistent with the cover cards around it (tester report, 7 October, Thee-Resia Samentuin). On a white, unpadded 16:9 area such a logo fills the box exactly, like a cover, and a transparent mark still shows whole and centred on white.
- *Why still `object-contain` for a logo:* a logo that is not 16:9 must never lose part of a wordmark to a crop. Contain is what keeps that true; the 16:9 area is what makes a rule-following logo fill it.
- *Trade-off:* a bare mark with no margin of its own can now touch the card edge. Accepted: the house rule makes such files the exception, and an editor can add the margin when exporting at 16:9.

### D3 — One 16:9 image area on both pages (revised 2026-10-08)
The card's image area is `aspect-video` (16:9) on both the overview and the homepage, scaling with the card's width, instead of a fixed height per page (the first version kept `h-44` on the overview and `h-56` on the homepage). A fixed height gave a different ratio at every card width, so no file could be made to fit it; 16:9 matches what editors upload. The component no longer takes a height class. Cards in a grid row still share one height, since each column has the same width.

### D4 — The overview card gets the name panel
Today an overview card with no cover has no image area and its text starts at the top. With the chain, it shows the name panel. This makes the grid uniform and is what the spec now requires. The name below the panel stays, so the name appears twice on such a card; that is already the case on the homepage and is accepted.

## Risks / Trade-offs

- [Mixed grids] → Until most organisers have a logo, a grid mixes logo panels and photos, which look different. Mitigation: the neutral panel plus padding keeps a logo card the same height and shape as a photo card; the chain is the user's explicit choice.
- [Tiny or low-resolution logos] → `object-contain` scales up a small logo to the panel height and it may look soft. Mitigation: none in this change; editors can upload a larger file. Noted in the proposal's impact as a content concern.
- [Name twice on a card] → See D4; accepted.
- [Description lookup per card] → `DescribedImage` reads media details for each logo on the overview, as it already does for each cover. No new cost per card.

## Migration Plan

No data changes. Implement the helper and component, switch both pages, done. Rollback is reverting the two page edits; the helper and component are inert on their own.
