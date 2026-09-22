## 1. The menu (D1, D2, D3)

- [x] 1.1 Add a client component wrapping a `<details>` disclosure: a labelled
      `<summary>` rendering a menu icon, and the panel as its content. Strip the
      default marker.
- [x] 1.2 Add the behaviour the native element lacks: Escape closes and returns
      focus to the summary, an outside click closes, and a path change or a click
      inside the panel closes.
- [x] 1.3 Put it in the header below `md` only, with the panel holding `NavLinks`
      vertically plus "Evenement indienen". Leave the wordmark, the Agenda button,
      and the `md` and wider layout untouched.

## 2. Verify (D4)

- [x] 2.1 Run `pnpm test`, `pnpm typecheck`, and `pnpm lint`.
- [x] 2.2 Check in a browser at 375px, against the running app:
      - The menu button is present and labelled; the panel is closed initially.
      - Opening it reveals every `mainNav` entry and "Evenement indienen", each
        linking to the right page.
      - `aria-expanded` follows the open state.
      - Escape closes it and focus returns to the button; an outside click closes
        it; following a link closes it and does not leave it open on the next page.
      - The whole flow works by keyboard alone, with a visible focus indicator.
      - With JavaScript disabled, the button still opens the panel and the links
        work.
      - No default disclosure marker is visible, and there is no horizontal
        scrolling.
- [x] 2.3 Check at 768px and 1200px that no menu button is shown and the header is
      unchanged.
