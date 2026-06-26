## Context

The visual language is centralised in two files: `src/app/globals.css` (a
Tailwind v4 `@theme` token block + base element styles) and `src/app/layout.tsx`
(the Fraunces + Hanken font wiring). Components consume the tokens through
generated utility classes (`bg-cream`, `text-terracotta-strong`, …) and two
prop vocabularies — `Badge tone=` and `Button variant=`. A reskin therefore has
a small "source of truth" (the token block + fonts) and a large but purely
mechanical "fan-out" (~230 class usages across ~33 files).

This change is **cosmetic only**: no markup logic, structure, routes, data, or
section layout change. The Eventchamp "multiple-v2" demo is an *aesthetic*
reference (cool, all-sans, green, modern-event); its functional traits are out
of scope.

## Goals / Non-Goals

**Goals:**

- A green, cooler, all-sans look applied consistently through tokens.
- Semantic token names that no longer encode a (now-wrong) warm hue.
- WCAG 2.1 AA preserved on every text/background pairing.
- Mechanical, reviewable migration with a guard against stale class names.

**Non-Goals:**

- No layout/section restructure; the hero stays (restyled only).
- No new components or card elements (date chips, category pills, status
  labels). Existing elements are restyled, not added to.
- No new dependencies; no functional/behavioural change.

## Decisions

### D1 — Rename only the hue-literal tokens; re-tint the rest

`surface`, `border`, `ink`, `muted` are already *role* names — they don't claim
a warmth — so they keep their names and only their **values** shift cooler.
Only the hue-literal tokens are renamed (and revalued). This avoids ~80
needless edits (`ink` ×24, `muted` ×56) and the awkward `bg-bg` utility.

```
   OLD TOKEN            NEW TOKEN         ROLE              CHURN
   ────────────────────────────────────────────────────────────────
   cream             → canvas            page background    ~9
   sand              → surface-2         alt surface        ~22
   terracotta        → brand             brand fill/accent  ~71
   terracotta-strong → brand-strong      brand on white     ~45
   saffron           → accent            gold "pop"         ~3
   forest            → (removed)         folded into green  ~13 + 4 tones
   surface  (keep, revalue: still #ffffff)
   border   (keep, revalue cool)
   ink      (keep, revalue cool near-black)
   muted    (keep, revalue cool gray-green)
```

`Badge tone="terracotta"` → `tone="brand"`, `tone="saffron"` → `tone="accent"`,
`tone="forest"` → `tone="brand"`; `Button variant=` similarly. `forest` is
dropped because a green secondary accent collides with the green brand; its
"published / success / recurrence" usages map to the brand green.

### D2 — Proposed values + AA targets (to verify, not assume)

Starting values; the AA pass (tasks) may nudge them. Contrast is the gate.

```
   TOKEN            HEX (proposed)   AA REQUIREMENT (target)
   ───────────────────────────────────────────────────────────────
   canvas           #f4f7f4          cool off-white page bg
   surface          #ffffff          card bg
   surface-2        #e9efea          alt surface
   border           #d6e0d9          hairline (non-text)
   ink              #1b2620          body text — ≥12:1 on canvas/surface
   muted            #4f5d54          2nd text — ≥4.5:1 on canvas & surface
   brand            #2f8f4e          accent/fill, borders, hover, focus ring
   brand-strong     #2b6a3c          link text & white-on-fill — ≥4.5:1 on white
   accent           #d99a1e          gold decorative fill/border (pair w/ ink text)
   ───── admin chrome (dark, cool/green-tinted) ──────────────────────
   admin            #15211a          dark chrome surface
   admin-fg         #eef3ee          text on chrome — ≥12:1
   admin-border     #35443a          hairline on chrome
   admin-accent     #62cf86          bright green accent — ≥4.5:1 on admin
   admin-danger     #f0a085          KEEP warm — destructive stays red, not green
```

Notes: `brand-strong` (#2b6a3c ≈ 6.3:1 on white) carries the many
`text-terracotta-strong` link usages and white-on-green buttons. `accent` gold
is **decorative** — it pairs with dark `ink` text (gold-as-text rarely hits AA),
matching how `saffron` is used today. `admin-danger` deliberately stays a warm
coral: "destructive" should not read green.

### D3 — All-sans typography

Remove the Fraunces `next/font` import, the `--font-fraunces` variable, and the
serif `--font-display` stack from `layout.tsx`/`globals.css`. Point the heading
stack at Hanken Grotesk (`--font-sans`), and give `h1–h4` a heavier weight
(≈700) with slightly tighter tracking so headings read bold and modern rather
than dainty. One font family, fewer network requests, cleaner event-site feel.

### D4 — Migration mechanics & the stale-name guard

Order of operations:
1. Rewrite the `@theme` block in `globals.css` (new names + values) and the
   base styles (focus ring → `brand`, `.admin-chrome*` → green-tinted,
   `.prose-warm` blockquote → `accent`).
2. Mechanical class find/replace across `src/**/*.tsx` per the D1 map, on the
   utility *fragments* (`-terracotta-strong` → `-brand-strong` first, then
   `-terracotta` → `-brand`, then `-cream` → `-canvas`, `-sand` → `-surface-2`,
   `-saffron` → `-accent`, `-forest` → `-brand`). Order matters so
   `terracotta-strong` isn't half-rewritten by the `terracotta` rule.
3. Rename the `Badge tone` union + internal tone→class map, and `Button
   variant` likewise.
4. Swap fonts in `layout.tsx`.
5. **Guard:** grep `src` for any surviving `cream|sand|terracotta|saffron|forest`
   fragment. Tailwind silently ignores unknown utility classes, so a missed
   rename fails *invisibly* (element loses its colour) — the grep is the only
   reliable gate. CI-style check: zero matches before done.
6. Re-verify AA for every pairing in D2 and visually smoke-test key pages.

## Risks / Trade-offs

- **Silent class misses** → a stray `bg-terracotta` renders nothing, not an
  error. Mitigation: the D4 grep gate + a build/lint pass + visual smoke test.
- **`.prose-warm` is now a misnomer** → it's a class *name*, not a token; renaming
  it ripples into MDX components. Leave the name (purely cosmetic debt) and only
  change its colour values, to stay low-risk. Note for a later cleanup.
- **Loss of a distinct secondary hue** → folding `forest` into `brand` means
  date/recurrence/category badges that were two hues become green+gold only.
  Acceptable for a cosmetic pass; `accent` (gold) covers cases needing contrast.
- **Green AA is tighter than terracotta** → white-on-green needs a sufficiently
  deep `brand-strong`; the proposed #2b6a3c clears 4.5:1 but leaves little
  headroom on the lighter `canvas`, so links on canvas must use `brand-strong`,
  not `brand`. The AA pass confirms each surface.
- **Admin accent contrast** → a bright green on near-black must still clear AA
  for small text/icons; #62cf86 targets ~7:1 but is verified, not assumed.
