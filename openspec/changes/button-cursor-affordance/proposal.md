## Why

Buttons on the site and in the backend do not look clickable: the mouse
pointer stays an arrow over every button, so a visitor cannot tell a button
from a label until they press it. Links already show the hand pointer, which
makes buttons read as the odd ones out. The tester asked on 14 October 2026
for every button to show it can be clicked, by a hover change, a pointer, or
both. The cause is a change in the CSS framework's reset: since version 4 it
no longer gives buttons the hand pointer, and the site never added it back.

## What Changes

- Every enabled button, element with the button role, and `<summary>` control
  shows the **hand pointer** on hover, on public pages and in the backend
  alike, from one base style rule rather than per component.
- The **hover colour change** every button variant already has stays as the
  second cue, so a button signals both before and during the hover.
- A **disabled** button keeps the arrow pointer, so a control that cannot be
  pressed does not invite a press.
- Links are unchanged: they already show the hand pointer.

Not in scope: changing button colours, sizes or hover styles; touch devices,
which have no hover.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `design-system`: new requirement **Actionable controls signal they can be
  pressed** — pointer and hover cues on buttons, with the disabled exception.

## Impact

- `src/app/globals.css`: one rule in the base layer.
- No component changes: the shared `Button`, the backend `SubmitButton`, and
  the hand-styled buttons in the date list, image list and uploader all
  inherit it.
- No stored content, no API, no migration.
