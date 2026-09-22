## Context

```
 header.tsx (server component, in the root layout)
 ├─ wordmark → /
 ├─ <nav aria-label="Hoofdnavigatie" class="hidden md:block"> → <NavLinks/>   ← gone below 768px
 └─ ButtonLink "Evenement indienen"  (max-sm:hidden)   ← gone below 640px
    ButtonLink "Agenda"              (md:hidden)       ← the only mobile destination
```

`NavLinks` is already a client component: it reads `usePathname()` to mark the
active entry, and renders on the server as well, so its links exist in the HTML
without JavaScript.

The header lives in the root layout, so it is not re-mounted when a visitor
navigates between pages. Any open/closed state therefore survives a soft
navigation and has to be closed deliberately.

## Goals / Non-Goals

**Goals:**
- Every primary entry reachable from the header at any width.
- Keyboard and screen-reader operable, and working without JavaScript.
- No change at 768px and above.

**Non-Goals:**
- Changing the navigation entries.
- A slide-in drawer, animation, or scroll locking.
- Touching the footer.

## Decisions

### D1. A native `<details>` disclosure, enhanced with JavaScript

The panel is a `<details>` element whose `<summary>` is the menu button.

*Why:* it opens and closes with no JavaScript at all, which is what makes the
"Without JavaScript" scenario hold. The browser gives the button a button role,
keyboard activation with Enter and Space, and `aria-expanded` that tracks the
open state on its own. Everything else here is an enhancement on top.

*Alternative:* a `useState` button with `aria-expanded` and a conditionally
rendered panel. It ships more code, and with JavaScript off the button does
nothing at all, leaving a phone visitor with no navigation — exactly today's bug.

A small client component supplies what the native element does not:
- **Escape** closes it and returns focus to the summary.
- **An outside click** closes it.
- **Following a link** closes it. Since the header is never re-mounted, this
  watches `usePathname()` and closes when the path changes. It also closes on a
  click inside the panel, which covers a link to the page you are already on.

### D2. The panel holds the same entries, plus what the header hides

`mainNav` stays the single source of the entries (`NavLinks` reused with a
vertical layout), followed by "Evenement indienen", which the header hides below
640px. So the phone header offers: wordmark, Agenda, menu → every page plus the
call to action.

The "Agenda" button stays as it is. It is one tap to the busiest page, and the
duplication inside the menu is cheaper than a phone visitor hunting for the
agenda behind a button.

### D3. Below `md` only, matching the existing breakpoint

The disclosure is `md:hidden`, the mirror of the nav's `hidden md:block`, so the
two never appear together and nothing changes at 768px and above. The panel is
positioned under the sticky header, full width, scrolling with the page; no
scroll lock and no focus trap, since it is a short disclosure rather than a modal.

### D4. Focus returns on Escape, but is not moved on open

Opening leaves focus on the summary, so the next Tab reaches the first link —
the ordinary reading order for a disclosure. Escape closes and puts focus back,
so a keyboard visitor is never dropped onto the page body.

## Risks / Trade-offs

- **[`<details>` styling]** The default marker must be removed
  (`[&::-webkit-details-marker]:hidden`, `list-none`) or a triangle appears
  beside the icon. → Covered by a check at phone width.
- **[Screen-reader support for `summary`]** Support is good but not identical
  everywhere; some readers announce "summary" rather than "button". → Accepted:
  the trade is against a control that does nothing without JavaScript. The
  summary carries an explicit label.
- **[State surviving navigation]** Handled in D1 by watching the path; a missed
  case leaves the menu open over the new page. → Covered by a browser check.

## Migration Plan

No data or configuration changes. Deploy, then check a phone width on the live
site. Rollback is a revert.
