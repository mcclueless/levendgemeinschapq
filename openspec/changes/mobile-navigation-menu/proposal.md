## Why

On a phone the header shows only the wordmark and an "Agenda" button: the
primary navigation is `hidden md:block`, so below 768px it disappears with
nothing to replace it. Projecten, Organisatoren and Blog are then reachable only
by scrolling to the footer, and "Evenement indienen" vanishes below 640px. A
visitor reported the missing menu; it was never there, and the site has shipped
this way since the first commit.

The `accessibility-compliance` spec asks for a layout "adapted to that viewport".
Dropping most of the navigation is not adapting it.

## What Changes

- The header gets a **menu button on small screens** that opens the same primary
  navigation, plus the "Evenement indienen" call to action that is hidden there.
- The menu closes when a visitor follows a link, presses Escape, or clicks
  outside it, and it says whether it is open (`aria-expanded`).
- It is **operable by keyboard and reported to assistive technology**, and works
  without JavaScript, since it is a native disclosure.
- At 768px and wider nothing changes: the menu button disappears and the
  horizontal navigation is unchanged.
- The "Agenda" button stays next to the menu button, as the one-tap shortcut to
  the busiest page.

Not in scope: changing which entries the navigation holds, a slide-in drawer or
animation, and the footer.

## Capabilities

### Modified Capabilities

- `accessibility-compliance`: the **Responsive layout** requirement gains an
  explicit rule that the primary navigation stays reachable at every viewport,
  with a new requirement for the small-screen menu and how it behaves.

## Impact

- `src/components/layout/header.tsx`: the menu button and panel below `md`.
- A new client component for the disclosure behaviour (Escape, outside click,
  close on navigation).
- `src/components/layout/nav-links.tsx`: reused for the panel's links, in a
  vertical arrangement.
