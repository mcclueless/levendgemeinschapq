## 1. The rule (D1, D2)

- [x] 1.1 Add the `cursor: pointer` rule to the base layer of
      `src/app/globals.css` for `button:enabled`,
      `[role="button"]:not([aria-disabled="true"])` and `summary`, with a
      comment naming the Tailwind 4 reset as the reason. Verify with
      `pnpm lint` and `pnpm typecheck`.

## 2. Verify

- [ ] 2.1 In the running app, read the computed `cursor` of a public submit
      button, a backend hand-styled button (the date list's "+ Datum
      toevoegen") and a disabled button: pointer, pointer, default. The mobile
      menu toggle and an "i" button still show the pointer. (14 October 2026:
      the public submit button, its disabled state and the menu toggle were
      checked in the dev server; the backend button only by selector match,
      so the backend half is still to be seen.)
- [ ] 2.2 After deploy, hover a button on goeddoen.net and in the backend:
      the hand pointer and the colour change both show.
