## 1. The choice list and the parser (D2, D3)

- [x] 1.1 In `src/content/recurrence-form.ts`: `RecurrenceChoice`, the
      `CHOICES` table, `ADMIN_CHOICES`, `PUBLIC_CHOICES`, `choiceFor`, and
      `recurrenceFromForm(form, start, choices, stored?)` reading a choice
      or `stored`. Remove the stored-interval parameter. Keep the field
      names, the end-date requirement and the range check as they are.
- [x] 1.2 Add `src/content/recurrence-form.test.ts`: `biweekly` with an end
      date stores weekly interval 2; `weekly` stores interval 1 even when a
      biweekly recurrence is stored; `stored` keeps a stored every-3-weeks
      rhythm with the posted end date; `stored` without a stored recurrence
      yields none; `biweekly` under `PUBLIC_CHOICES` yields none; a
      repeating choice without an end date is still `recurrence-missing`;
      `choiceFor` maps weekly/1, weekly/2, monthly/1 and returns undefined
      for weekly/3 and monthly/2.
- [x] 1.3 In `src/app/beheer/actions.ts`: `ADMIN_CHOICES` in
      `adminRecurrence` and `updateEvent`; `updateEvent` passes
      `stored.data.recurrence` instead of its interval. In
      `src/app/evenement-indienen/actions.ts`: `PUBLIC_CHOICES`. Verify
      with `pnpm typecheck`.

## 2. The forms (D4, D5)

- [x] 2.1 Add `src/components/admin/recurrence-select.tsx` rendering
      Eenmalig, the offered choices (Wekelijks, Elke 2 weken,
      Maandelijks) and, for a stored rhythm that matches no choice, a
      selected `stored` option labelled by `recurrenceLabel`.
- [x] 2.2 Use it on the backend create form (no stored value) and the edit
      form (`stored={d.recurrence}`), replacing the hand-written selects.
      Leave the public form's select as it is.

## 3. Verify

- [x] 3.1 `pnpm test` (also under `TZ=UTC`), `pnpm typecheck`,
      `pnpm lint`. All pass.
- [x] 3.2 On a local dev server with a throwaway admin password: create an
      event every two weeks with an end date and see it in the agenda on
      alternate weeks and its page say "Elke 2 weken"; open it, the select
      shows "Elke 2 weken"; switch it to Wekelijks, save, and the agenda
      shows every week. Place a temporary event file with
      `recurrence: { freq: weekly, interval: 3, until: ... }`, open its edit
      form, see "Elke 3 weken" selected, change only the title, save, and
      confirm the file still carries interval 3. Remove the temporary
      content. (Done 16 October 2026 on the dev server with a throwaway
      admin password: all of the above held; the agenda showed 6 and 20
      November and 4 December for the biweekly event, and weekly Fridays
      after the switch.)
- [ ] 3.3 After deploy on goeddoen.net: the tester sets an event to "Elke 2
      weken" and sees it on alternate weeks in the agenda.
