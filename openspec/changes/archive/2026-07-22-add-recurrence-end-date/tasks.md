## 1. Shared recurrence parsing

- [x] 1.1 Add a `recurrenceFromForm(form, start, { allow })` helper next to the existing recurrence code (`src/content/recurrence.ts` or a sibling module) that reads `recurrence` and `recurrenceUntil` from a `FormData`, where `allow` is the permitted frequency set — `["weekly", "monthly"]` for the backend, `["weekly"]` for the public form (design D7, D8)
- [x] 1.2 Return "no recurrence" when the frequency is absent, `none`, or outside `allow` — treat an out-of-set value as non-repeating rather than an error (design D7)
- [x] 1.3 Return a **missing-end-date** result when a permitted frequency is set but `recurrenceUntil` is empty (design D5)
- [x] 1.4 Return an **invalid-range** result, distinguishable from missing, when `until` is earlier than `start` (design D5)
- [x] 1.5 On success return `{ freq, interval: 1, until }`, normalising `until` (a `date` input, so `"YYYY-MM-DD"`) to the **end** of that day so an occurrence falling on the end date is still included by `occurrencesInRange`'s `occ > end` comparison (design D4)
- [x] 1.6 Discard `recurrenceUntil` and skip both validations when the event is non-repeating (design D6)
- [x] 1.7 **Do not touch `src/content/schema.ts`.** `RecurrenceSchema.until` stays `.optional()` — requiring it in zod would make `parseAll` silently skip existing open-ended events and break iCal imports of open-ended series (design D2)

## 2. Admin create path

- [x] 2.1 Add a "Herhalen tot en met" date input (`name="recurrenceUntil"`, `type="date"`) inside the existing `Herhaling` field group in `src/app/beheer/nieuw/evenement/page.tsx`, with a hint distinguishing it from "Einde"
- [x] 2.2 Replace `recurrenceFrom(formData)` in `createEvent` (`src/app/beheer/actions.ts`) with the shared helper, passing the parsed `start` and `allow: ["weekly", "monthly"]`
- [x] 2.3 Redirect to `/beheer/nieuw/evenement?error=recurrence` on either recurrence failure, leaving the existing `?error=1` required-field branch intact
- [x] 2.4 Make `src/app/beheer/nieuw/evenement/page.tsx` read `searchParams` and render an error banner distinguishing "vul alle verplichte velden in" (`error=1`) from the recurrence messages (`error=recurrence`) — the admin forms currently render nothing for `?error=1`

## 3. Admin edit path

- [x] 3.1 Add the same "Herhalen tot en met" input to `src/app/beheer/[type]/[slug]/bewerken/page.tsx`, prefilled from `d.recurrence?.until` formatted as `YYYY-MM-DD`
- [x] 3.2 Switch `updateEvent` to the shared helper and add the `?error=recurrence` redirect to the edit path
- [x] 3.3 Render the error banner on the edit page for both error values
- [x] 3.4 Confirm the forced-end-date consequence is acceptable in practice: saving an existing open-ended recurring event (e.g. `content/events/repair-cafe.mdx`) now requires supplying an end date, even for an unrelated edit (design "Risks", first bullet)
- [x] 3.5 Confirm against `docs/bugs/recurrence-edit-clobber.md`: adding this input stops `until` being lost on save, but `interval` is still replaced with `1`. Do **not** fix that here — verify the bug report still reproduces for `interval` and note it there

## 4. Public submission path

- [x] 4.1 Add a `Herhaling` select to `src/app/evenement-indienen/page.tsx` offering **only** `Eenmalig` and `Wekelijks` (default `Eenmalig`) — no monthly option (design D7)
- [x] 4.2 Add the "Herhalen tot en met" date input to the same group on the public form
- [x] 4.3 Parse recurrence in `submitEvent` (`src/app/evenement-indienen/actions.ts`) with the shared helper and `allow: ["weekly"]`, so a hand-crafted POST carrying `monthly` is treated as non-repeating rather than persisted
- [x] 4.4 Include `recurrence` in the `createDocument` frontmatter, leaving `status: "pending"`, `submittedBy`, and `submittedAt` untouched (design D9)
- [x] 4.5 Add a `?error=recurrence` branch to the page's existing error banner, alongside the current "Vul alle verplichte velden in." message

## 5. Approval queue visibility

- [x] 5.1 Widen `PendingEvent.recurrence` in `src/content/admin.ts` from `"weekly" | "monthly"` to carry the frequency plus the optional end date
- [x] 5.2 Populate it in `getPendingSubmissions()` from `e.data.recurrence`
- [x] 5.3 Render the interval and end date on the queue entry in `src/app/beheer/queue/page.tsx`, indicating explicitly when a recurrence is open-ended (imported submissions can still be open-ended)

## 6. Verification

- [x] 6.1 Admin: create a weekly event with an end date two weeks out — confirm exactly the expected occurrences appear on `/agenda` and none after the end date
- [x] 6.2 Admin: confirm an occurrence falling exactly **on** the end date is still listed (design D4 end-of-day normalisation)
- [x] 6.3 Admin: mark an event weekly and leave the end date empty — confirm the save is rejected with the "required" message, not the "before start" message
- [x] 6.4 Admin: submit an end date before the start — confirm the save is rejected and the form reports that specifically
- [x] 6.5 Admin: pick an end date, then switch `Herhaling` back to `Eenmalig` — confirm the save succeeds and no `recurrence` key is written
- [x] 6.6 Admin: open and save an existing open-ended recurring event — confirm the end date is demanded (task 3.4)
- [x] 6.7 Public: confirm the form offers only `Eenmalig` and `Wekelijks`
- [x] 6.8 Public: POST a `monthly` value directly at the action — confirm no monthly recurrence is persisted
- [x] 6.9 Public: submit a weekly event with an end date — confirm the document is written `pending` with the recurrence, appears in the queue with its interval and end date, and none of its occurrences are public before approval
- [x] 6.10 Public: confirm the submission is published with its recurrence intact after an Administrator approves it, and that an Administrator can widen it to monthly first
- [x] 6.11 Confirm existing events with no `until` (`content/events/repair-cafe.mdx`) still parse, render, and list unchanged — no migration, and confirm they are **not** skipped by `parseAll` (design D2)
- [x] 6.12 Confirm an iCal import of an `RRULE` with no `UNTIL` still succeeds and stores an open-ended recurrence
- [x] 6.13 Run `pnpm typecheck` and `pnpm test`
