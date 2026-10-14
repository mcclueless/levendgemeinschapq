## Context

`media-uploader.tsx` renders one `<form>` for both worlds. Before hydration
(`enhanced` false) it is a single-file form: label "Nieuwe afbeelding", a
visible `<input type="file" required>`, and a `SubmitButton` posting to
`uploadMedia`. Once hydrated it switches to `multiple`, hides the submit button,
and uploads on `change` and on drop, one request per file.

`image-list-field.tsx` and `body-editor.tsx` already follow the design-system
rule for a styled upload control: a visible `<button type="button">` that
calls `click()` on an `sr-only` file input with `tabIndex={-1}` and
`aria-hidden`.

## Goals / Non-Goals

**Goals:** the enhanced branch reads as a button; the no-script branch is
untouched; the drop zone, per-file results and limits stay.

**Non-Goals:** restyling the drop zone; the other upload controls.

## Decisions

### D1. The enhanced branch swaps the visible input for a button

When `enhanced`, render the shared `Button` (primary, `type="button"`) labelled
**"Afbeeldingen uploaden"**, and move the file input to `sr-only` with
`tabIndex={-1}` and `aria-hidden`, the pattern the image list uses. The button
is disabled while `busy` and then reads "Bezig met uploaden…", as the image
list's does.

Before hydration nothing changes: label, visible input, "Uploaden" button.
The switch is the existing `enhanced` flag, so the no-script path is the
server-rendered one, as today.

*Why the shared primary `Button`:* this is the page's main action and there is
no sibling button to match, so "matches the other buttons" means the backend's
primary look, which `SubmitButton` and `Button` share.

### D2. The label goes, the hint stays

A `<label>` on a hidden input reads as a stray heading, which is what made the
control look like a field. When enhanced, the button names the action and the
existing hint ("Kies een of meer afbeeldingen, of sleep ze hierheen…") stays
under it. The `htmlFor` label is rendered only in the no-script branch.

### D3. Text that pointed at the old label

`image-field.tsx` tells an editor with an empty pool to upload "via ‘Nieuwe
afbeelding’". Task 1.2 reads which control it means and names that control's
actual label.

## Risks / Trade-offs

- [Hydration mismatch] → the switch already exists and runs in an effect, so
  the server and first client render agree.
- [Keyboard users] → the button is a real button; the hidden input is out of
  the tab order, as in the image list.
