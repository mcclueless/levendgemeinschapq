## Context

```
  TODAY                              REFERENCE (hopehappystars.com)
  ┌───────────────────────────┐      ┌─────────────┬─────────────┐
  │ Badge                     │      │ church .jpg │   #a59593   │
  │ H1 + paragraph            │      │ fixed       │   heading   │
  │ [agenda] [indienen]       │      ├─────────────┴─────────────┤
  │ two faint radial          │      │          #8ca6c7          │
  │ gradients, no imagery     │      │      upcoming events      │
  ├───────────────────────────┤      ├─────────────┬─────────────┤
  │ Upcoming events  (cards)  │      │   #a59593   │Projects.jpg │
  ├───────────────────────────┤      │             │ fixed 0% 50%│
  │ Projects         (cards)  │      ├─────────────┴─────────────┤
  └───────────────────────────┘      │          #85a7ca          │
                                     └───────────────────────────┘
    zero photographs on the page       photos washed: opacity 0.7
    public/ = 1 svg                    over a flat colour
```

The reference is a WordPress/Enfold build. Its structural idea is worth taking;
its palette is not (see proposal Non-Goals, and D1 below).

## Goals / Non-Goals

**Goals:**

- Put the neighbourhood on the neighbourhood's homepage.
- Borrow the split-panel + duotone device that makes mixed-quality community
  photography cohere.
- Keep every word on the page exactly as it is.
- Stay inside the existing palette, the AA contrast requirement, and the
  performance budget.

**Non-Goals:**

- The reference palette (D1), parallax (D3), any other page, any copy change.

## Decisions

### D1 — The wash colour is a parameter, and we set it to green

The reference's look reads as "blue" but the mechanism is `opacity: 0.7` over a
flat colour. That colour is a variable. Washing the same photographs in
`--color-brand-strong` produces the same layered, tinted, deliberate feel in the
site's own palette.

This is what makes the change homepage-only. A palette swap could not be: the
tokens live in `globals.css` and the `design-system` spec, so changing them
changes `/agenda`, `/projecten`, `/blog` and the whole backend. Scoping new panel
colours to just this page would satisfy "homepage only" on paper while producing
a homepage that looks like a different website from the page it links to.

Recorded so a later reader does not mistake this for an oversight: the blue was
evaluated, and declined on three independent grounds — it reverses a four-week-old
decision, it cannot be page-scoped coherently, and it fails contrast (below).

### D2 — Contrast is not free, because the backdrop is a photograph

The current palette passes comfortably (`white on brand-strong` 8.14:1,
`ink on canvas` 15.00:1). The reference palette does not:

```
  white text on…      #a59593  2.87:1   #8ca6c7  2.50:1
                      #6786a1  3.82:1   #85a7ca  2.51:1     AA needs 4.5:1
```

But a green wash does not inherit `brand-strong`'s 8.14:1 either, because what
sits underneath is a photograph with unknown luminance. A bright sky behind white
text fails regardless of the wash.

So text over imagery needs a **deterministic** floor, not a hopeful one: text
sits on the flat colour panel, not on the photograph — or, where it must overlap,
a scrim gradient guarantees the local background. The wash is decorative; the
scrim is what carries the contrast. `lighthouserc.json` gates accessibility at
`["error", { "minScore": 0.95 }]`, so this is enforced, not aspirational.

### D3 — No parallax

The reference uses `background-attachment: fixed` on both photo panels. Not
carried over:

- it is janky-to-broken on iOS Safari;
- it forces the image to be a CSS background, which forfeits `srcset`, modern
  formats, and lazy/priority hints — directly against the LCP budget;
- there is **no reduced-motion policy anywhere in the specs** (`grep` across
  `openspec/specs/` for motion/animation returns nothing), so adding motion here
  would mean either adding that policy or shipping an accessibility gap.

If parallax is wanted later it should arrive with a `prefers-reduced-motion`
requirement, as its own change.

### D4 — Self-host the assets; do not hotlink

The photographs are the organisation's own, on its own current site — no
licensing issue. They are still copied in rather than referenced:

- `next.config.mjs` `remotePatterns` permits only the S3 media bucket, so a
  remote `hopehappystars.com` URL cannot be optimised;
- hotlinking would couple the new site's homepage to the old site's uptime, and
  the old site is the thing this project replaces.

Both are downscaled before committing. As delivered they are 621 KB (2000×1300)
and 763 KB (1584×1443) — 1.4 MB for two decorative images is most of the
performance budget.

### D5 — `next/image` for these two, deliberately

`cover-image.tsx`, `event-card.tsx` and `gallery.tsx` all use plain `<img>`,
each carrying a comment that optimisation waits on the media CDN. That reasoning
is about *content* images, whose URLs are remote and user-supplied.

These two are neither: they are local static files, checked into `public/`, known
at build time. `next/image` handles them with no CDN and no `remotePatterns`
entry, and supplies exactly what the budget needs — AVIF/WebP, a responsive
`srcset`, intrinsic dimensions (so CLS stays at zero), and `priority` for the
hero.

The deviation is intentional and narrow. It does not imply migrating the content
images, which still wait on the CDN.

### D6 — Crop origins differ per photograph

The two images are different shapes, and a shared crop rule would spoil one:

```
  Sint-Theresiakerk-2.jpg   2000 × 1300   ratio 1.54   object-position: 50% 50%
  Projects.jpg              1584 × 1443   ratio 1.10   object-position:  0% 50%
```

The reference site anchors `Projects.jpg` at `0% 50%`, meaning its subject sits
left of centre; centre-cropping a near-square image into a wide panel would cut
it. Follow the reference's origins rather than re-deriving them.

### D7 — Not a word changes

The `h1`, the intro paragraph, both button labels, and the `title`/`subtitle`
props passed to `UpcomingEvents` and `FeaturedProjects` keep their current
strings exactly. `UpcomingEvents` and `FeaturedProjects` themselves are not
modified — they are self-resolving components and this change only re-frames
them.

This is the explicit boundary of the request, and it is also what keeps the
change reviewable: any copy diff in this change is a mistake.

### D8 — Homepage-scoped components

The split panel lives in a homepage-scoped component. `Container`, `Card`,
`Badge` and `ButtonLink` are untouched. A device used on exactly one page should
not enter the shared library until a second page wants it.

## Risks / Trade-offs

- **A green wash over green-toned photography could go muddy.** Neither image has
  been seen rendered under the wash. A church exterior and whatever `Projects.jpg`
  depicts may sit anywhere on the hue wheel. The wash opacity and blend need
  judging by eye against the real images; if the result is drab, the honest
  answers are to lower the opacity or reach for a duotone (shadow-tint) rather
  than a flat overlay — not to abandon the palette decision.
- **The homepage will look different from the rest of the site.** Intended — it
  is the only page with a hero — but the gap should stay a matter of density,
  not of palette or type.
- **LCP.** A full-bleed hero photograph is the classic LCP element. Mitigated by
  D4 and D5, and the budget only *warns* at 2500 ms, but it should be measured
  rather than assumed.
- **`force-dynamic` stays.** The homepage renders per request
  (`content-storage`: live listings, no CDN lag). Nothing here changes that, and
  static images are unaffected by it.

## Open Questions

- **50/50 split, or asymmetric?** The reference is even. An asymmetric split
  (image wider than the text panel, or vice versa) may sit better with the
  existing type scale. A judgement to make against the rendered page.
- **Does the projects panel sit above or beside the projects grid?** The
  reference puts the image beside a heading and the cards below. Whether the
  cards keep their current full-width treatment is open.
- **Should the hero photograph be full-bleed on mobile**, or should the split
  collapse to text-only with the image below? Full-bleed reads better; stacking
  is cheaper for LCP on the smallest screens.
