## Why

The Herhaling (recurrence) select on the event forms offers Eenmalig,
Wekelijks and Maandelijks. An organisation that meets every other week
cannot say so: the first organisation-account tester asked on 16 October
2026 for "every two weeks" under Herhaling. The system already understands
it — the stored recurrence carries an interval, the agenda steps by it, every
description reads "Elke 2 weken", and the calendar import writes it — but no
form lets an editor choose it. Today an editor can only keep a biweekly
rhythm that arrived through import, never set one.

## What Changes

- **A fourth choice on the backend forms.** The event create and edit forms
  offer "Elke 2 weken" between Wekelijks and Maandelijks. It is stored as the
  weekly frequency with interval 2, exactly as the import stores it, so the
  agenda, the event page, the queue and the sharing metadata need nothing.
- **The edit form shows the stored rhythm truthfully.** A recurrence the
  select cannot express — an imported "every 3 weeks" or "every 2 months" —
  appears as its own, selected, option labelled with the system's usual
  phrase, and is kept on save until the editor picks something else. This
  replaces the current behaviour, where such an event is shown as
  "Wekelijks" and its interval is silently carried through so that a save
  does not flatten it.
- **An explicit choice wins.** Picking Wekelijks on an event that repeated
  every two weeks makes it weekly; today the stored interval would survive
  that choice.

Not in scope: the public submission form, which stays weekly-only — that
narrowing was a deliberate decision, and an administrator can widen a
submission on its edit form after approval. If the tester or the
administrator wants the public form to offer it too, that is a one-line
extension of the same choice list. Also out of scope: arbitrary intervals,
and anything about the recurrence end date.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `events`: requirement **Repeatable (recurring) events** names every two
  weeks among the rhythms an editor can choose.
- `editorial-backend`: requirement **Recurrence controls on the event
  forms** gains the "every two weeks" choice, the truthful prefill of a
  stored rhythm the selector does not offer, and the rule that an explicit
  choice replaces the stored interval.

## Impact

- `src/content/recurrence-form.ts`: the select value becomes a choice
  (none, weekly, biweekly, monthly) mapped to frequency and interval; the
  parser takes the stored recurrence instead of a bare stored interval and
  honours a "keep what is stored" choice on the edit form only. A new test
  file for this module, which has none today.
- `src/app/beheer/actions.ts`: `updateEvent` passes the stored recurrence;
  the choice lists replace the frequency lists.
- The backend event create and edit forms: one shared select with the
  choices, the edit form adding the stored-only option.
- `src/app/evenement-indienen/`: no visible change; it keeps the weekly-only
  list under the new type.
- No data migration: nothing stored changes shape.
