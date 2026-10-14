## Context

Tailwind 4's reset sets `cursor: default` on buttons; Tailwind 3 set
`pointer`. The site never added it back, so `ui/button.tsx`, the backend
`SubmitButton` in `admin/form.tsx`, and the hand-styled buttons in
`date-list-field.tsx`, `image-list-field.tsx`, `body-editor.tsx` and
`media-uploader.tsx` all show the arrow. Only two `<summary>` elements carry
`cursor-pointer`. Links resolve to the pointer on their own.

`globals.css` keeps element styles in `@layer base`, below Tailwind's
utilities, so a utility on one element can still override a base rule.

Every button variant already changes background on hover
(`hover:bg-brand`, `hover:bg-surface-2`), so the hover cue exists.

## Goals / Non-Goals

**Goals:** one rule, every button, no per-component edits; disabled buttons
excluded.

**Non-Goals:** new hover styles; touch devices.

## Decisions

### D1. One base rule, not `cursor-pointer` per component

```css
@layer base {
  button:enabled, [role="button"]:not([aria-disabled="true"]), summary {
    cursor: pointer;
  }
}
```

In the base layer so a `cursor-*` utility can still win on one element, and
so the three hand-styled button sets inherit it without being touched.

*Alternative:* add `cursor-pointer` to each button class string. Rejected: four
class strings today, and the next hand-styled button would miss it again.

### D2. `:enabled`, not bare `button`

A bare `button` rule would show the hand on a disabled button. The uploader
and image-list buttons use `disabled` with reduced opacity but keep pointer
events, so they would invite a press. `:enabled` matches only form controls
that can be interacted with. `[role="button"]` has no native disabled state,
hence the `aria-disabled` exclusion.

### D3. The existing `cursor-pointer` on the two summaries stays

Harmless and explicit. Removing it would be churn for no gain.

## Risks / Trade-offs

- [A `<button>` used as a non-interactive element would get a pointer] →
  none found in `src`; every `<button>` has a handler or submits.
- [Admin chrome buttons on the dark bar] → the rule is cursor only; their
  contrast and hover states are unchanged.
