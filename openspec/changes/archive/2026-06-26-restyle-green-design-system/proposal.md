## Why

The site's current look is a warm, terracotta/cream, serif-led editorial style.
We want a cleaner, cooler, **green-forward, modern-event** aesthetic — in the
spirit of the Eventchamp "multiple-v2" demo. This is purely a visual refresh:
the information architecture, features, pages, and the homepage hero all stay,
only their styling changes. Green is the preferred brand colour.

## What Changes

- **Palette → green, semantic tokens.** Replace the warm literal colour tokens
  (`cream`, `sand`, `terracotta`, `saffron`, `forest`, …) with **semantic,
  green-based** tokens (`--color-bg`, `--color-surface`, `--color-brand`,
  `--color-brand-strong`, `--color-accent`, `--color-fg`, …). Update every
  usage (~230 occurrences across ~33 files) plus the `Badge tone=` and
  `Button variant=` props. Mechanical — no behaviour change.
- **Typography → all-sans.** Drop the Fraunces serif display font entirely and
  use Hanken Grotesk for both headings and body (headings at a heavier weight,
  tighter tracking) for a clean, modern-event feel.
- **Accent → green + gold.** The "pop"/highlight role (old saffron) becomes a
  warm gold/amber accent, paired with the green brand.
- **Admin chrome reskinned.** The dark management chrome (public admin banner +
  backend top bar) moves from warm-dark + saffron to a cool/green-tinted dark
  with a green accent, staying visibly distinct as "management mode".
- **Cosmetic only.** Existing components are restyled (colours, the sans type,
  radii, shadows, spacing, existing badges). **No** new card elements (date
  chips, category pills, status labels) and **no** layout/section changes — the
  Eventchamp demo is an aesthetic reference, not a feature spec. Its functional
  traits (category tabs, search, mega-menu, cart, sign-in) are out of scope.
- **Accessibility preserved.** Every text/background pairing continues to meet
  WCAG 2.1 AA; all new green/cool/gold pairings are re-verified.

## Capabilities

### New Capabilities

<!-- None — this is a restyle of an existing capability. -->

### Modified Capabilities

- `design-system`: The palette requirement shifts from a *warm* token set to a
  *green, semantic* token set; typography is specified as a single sans family
  (no serif display); the admin-chrome treatment is re-tinted cool/green while
  keeping its "distinct from the public palette" guarantee. AA-contrast
  requirements are unchanged in force, only re-verified against the new colours.

## Impact

- **Tokens / base styles**: `src/app/globals.css` (the `@theme` token block,
  base element styles, focus ring, `.admin-chrome*`, `.prose-warm` accents).
- **Fonts**: `src/app/layout.tsx` (remove the Fraunces import + `--font-fraunces`
  variable; keep Hanken Grotesk and route the display stack to it).
- **Components**: ~33 `.tsx` files that reference the renamed colour utilities,
  plus the `Badge` (`tone=`) and `Button` (`variant=`) prop vocabularies.
- **No** changes to routes, data, content, component structure/markup logic, or
  page/section layout. No new dependencies.
