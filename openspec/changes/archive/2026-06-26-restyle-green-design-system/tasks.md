## 1. Tokens & base styles (globals.css)

- [x] 1.1 Rewrite the `@theme` block: rename hue tokens (cream→canvas, sand→surface-2, terracotta→brand, terracotta-strong→brand-strong, saffron→accent), drop `forest`, keep `surface`/`border`/`ink`/`muted` names with cooler values; set the proposed green/cool/gold values from design.md D2
- [x] 1.2 Re-tint the admin-chrome tokens (`--color-admin*`) to cool/green-tinted dark + bright-green accent; keep `--color-admin-danger` warm
- [x] 1.3 Update base styles: body/heading colours, the `:focus-visible` ring → `brand`, `.admin-chrome` focus → `admin-accent`, `.prose-warm` blockquote border → `accent`
- [x] 1.4 Update the comment header (no longer "warm design system")

## 2. Typography (all-sans)

- [x] 2.1 In `layout.tsx`, remove the Fraunces import and `--font-fraunces` variable; keep Hanken Grotesk
- [x] 2.2 In `globals.css`, point `--font-display` at the Hanken sans stack (or replace `--font-display` usages with `--font-sans`); set `h1–h4` to a heavier weight (~700) with tighter tracking

## 3. Mechanical class migration (src/**/*.tsx)

- [x] 3.1 Replace utility fragments in dependency-safe order: `-terracotta-strong`→`-brand-strong` FIRST, then `-terracotta`→`-brand`, `-cream`→`-canvas`, `-sand`→`-surface-2`, `-saffron`→`-accent`, `-forest`→`-brand` (covers bg-/text-/border-/outline-/ring-/from-/to-/via- prefixes)
- [x] 3.2 Update any inline token references in non-class contexts (e.g. `var(--color-*)` in style props, gradient strings on the homepage hero, structured-data/theme-color if present)

## 4. Prop vocabularies

- [x] 4.1 Rename the `Badge` `tone` union + its tone→class map: `terracotta`→`brand`, `saffron`→`accent`, `forest`→`brand` (keep `neutral`/`warning`); update all `tone="…"` call sites
- [x] 4.2 Rename any `Button` `variant` values tied to the renamed tokens + their call sites

## 5. Guard & accessibility

- [x] 5.1 **Stale-name gate:** grep `src` for surviving `cream|sand|terracotta|saffron|forest` fragments — must be zero (Tailwind ignores unknown classes silently, so this is the real safety net)
- [x] 5.2 Verify WCAG 2.1 AA for every pairing in design.md D2: ink & muted on canvas/surface, brand-strong as link text on canvas & white, white on brand-strong, gold accent legibility, the green focus ring, and the admin-chrome pairings; adjust hex values until all clear
- [x] 5.3 Run `pnpm typecheck` and `pnpm lint`; resolve any prop-type fallout from the tone/variant renames

## 6. Visual verification

- [x] 6.1 Smoke-test key public pages (home + restyled hero, agenda, a detail page, projecten, blog) for the green/sans look with no broken/uncoloured elements
- [x] 6.2 Smoke-test the admin chrome (public admin banner + `/beheer` top bar) for the green-tinted dark treatment and AA-legible accents
