# Bug: editing an event silently destroys its recurrence `interval` and `until`

- **Reported:** 2026-07-22
- **Severity:** Data loss — silent, on save, with no error shown
- **Status:** Open — **narrowed** 2026-07-22 after `add-recurrence-end-date` shipped
- **Re-verified:** 2026-07-22 against the implemented change (see "Current state")
- **Spec violated:** `openspec/specs/editorial-backend/spec.md` → *Requirement: Create and edit all content types* — "on save SHALL update the same document in place, keeping its slug and any fields the form does not expose"

## Current state (after `add-recurrence-end-date`)

That change added a "Herhalen tot en met" input to the edit form, so
`recurrenceFrom` now round-trips `until`. **Half of this bug is therefore fixed
incidentally; the other half is unchanged.** Re-verified end to end against the
implemented code:

```
  stored:  freq: weekly, interval: 2, until: 2026-12-31T22:59:59.999Z
  action:  open the edit form, change ONLY the title, save
  result:  freq: weekly, interval: 1, until: 2026-12-31T22:59:59.999Z
                         ▲ still clobbered   ▲ now preserved
```

`uid` also survived, confirming `mergeDocument`'s top-level preservation is
working as designed — the defect is specifically that a nested object set by the
patch is replaced wholesale.

**Use the `interval` reproduction below; the `until` reproduction no longer
fires.** The `until` steps are kept for the record because they explain how the
class of bug arises.

## Summary

Saving the admin event edit form replaces the stored `recurrence` object
wholesale with a freshly built one. The edit form only exposes the recurrence
*frequency*, so every other key in the object — `interval` and `until` — is
discarded on save, even when the editor changed nothing about the recurrence.

Only iCal-imported events currently carry those keys, so they are the only
events that can lose data today. That will change: once
`openspec/changes/add-recurrence-end-date/` ships, hand-authored events will
carry `until` too.

## Reproduction

1. Import an event from an iCal feed whose `RRULE` has an interval and an
   `UNTIL`, e.g. `FREQ=WEEKLY;INTERVAL=2;UNTIL=20261231T000000Z`.
   `mapRecurrence` (`src/content/ical-import.ts:42`) maps it faithfully:

   ```yaml
   recurrence:
     freq: weekly
     interval: 2
     until: 2026-12-31
   ```

2. Open that event in the backend: `/beheer/evenementen/<slug>/bewerken`.
   The *Herhaling* select shows "Wekelijks". Nothing on the form shows the
   interval or the end date.

3. Change only the title. Click **Opslaan**.

4. Re-read the document. The recurrence is now:

   ```yaml
   recurrence:
     freq: weekly
     interval: 1     # was 2
                     # until: GONE
   ```

The save reports success. Nothing warns the editor. A fortnightly series has
become weekly, and a series that was scheduled to end now repeats indefinitely.

## Cause

`src/app/beheer/actions.ts:150`

```js
function recurrenceFrom(form: FormData) {
  const freq = str(form, "recurrence");
  if (freq === "weekly" || freq === "monthly") return { freq, interval: 1 };
  return undefined;
}
```

It reconstructs the object from the single form field, hardcoding
`interval: 1` and never reading `until`. `updateEvent` (`actions.ts:338`) then
passes the result straight into the patch:

```js
recurrence: recurrenceFrom(formData),
```

`mergeDocument` (`src/content/write.ts:85`) merges at the **top level only**:

```js
return serialize({ ...data, ...patch }, body);
```

So `recurrence` is a single key and the patch's value replaces the stored value
entirely. The field-preservation guarantee the spec describes — and which
`mergeDocument` genuinely provides for `uid`, `images`, `relatedVenues`,
`submittedBy`, and so on — does not extend *inside* a nested object that the
patch also sets.

```
  stored                    patch                    result
  ────────────────────      ────────────────────     ────────────────────
  uid: ical-123        ──▶  (absent)            ──▶  uid: ical-123      ✔ preserved
  submittedBy: jan     ──▶  (absent)            ──▶  submittedBy: jan   ✔ preserved
  recurrence:          ──▶  recurrence:         ──▶  recurrence:
    freq: weekly              freq: weekly             freq: weekly
    interval: 2               interval: 1              interval: 1      ✘ overwritten
    until: 2026-12-31         (no until)               (none)           ✘ destroyed
```

The same helper is used by `createEvent` (`actions.ts:178`), but there is no
stored value to lose, so creation is unaffected. Only the edit path is buggy.

## Scope of impact

| Path | Affected? |
|---|---|
| Admin event **create** | No — nothing to overwrite |
| Admin event **edit** | **Yes** — every save, whether or not recurrence was touched |
| Public submission | No — never writes `recurrence` today |
| iCal import | No — writes correctly; it is the *source* of the data that gets destroyed |
| Approve / hide / show | No — `setStatus` uses `patchFrontmatter`, which does not touch `recurrence` |

## Fix directions

Not prescribing one; each has a different blast radius.

1. **Read the missing keys into the form.** Expose `interval` on the edit form
   so `recurrenceFrom` reconstructs a complete object. Straightforward, but it
   only holds for as long as the form covers every key — the same bug returns
   the moment `RecurrenceSchema` grows a field.
2. **Merge the recurrence object rather than replacing it.** Have `updateEvent`
   read the stored recurrence and spread the form values over it, so unexposed
   keys survive. Fixes the class of bug for `recurrence` specifically.
3. **Make nested preservation the general rule.** Teach `mergeDocument` to merge
   plain objects one level deep. Widest fix, and the only one that also protects
   `socials` and any future nested field — but it changes the semantics of every
   content type's edit path and needs care around *intentional* clearing (how do
   you remove a key from a nested object if patches only ever merge?).

Option 3 deserves a design discussion before anyone reaches for it.

## Interaction with `add-recurrence-end-date` — resolved

That change has shipped. It was option 1 applied to `until` only, and it did
exactly what was predicted: the `until` symptom is gone, `interval` is untouched.
See "Current state" above.

Note that this makes the remaining defect *harder* to notice, not easier — the
obviously-wrong disappearing end date was the visible symptom, and it is now
fixed. A fortnightly series quietly becoming weekly is the kind of change nobody
spots until someone turns up on the wrong week.

`recurrenceFrom` was replaced by `adminRecurrence` →
`recurrenceFromForm(form, start, ADMIN_FREQUENCIES)` in
`src/content/recurrence-form.ts`. `interval: 1` is now hardcoded there, at the
`return { freq, interval: 1, until }` line, rather than in `actions.ts`. Fix
option 1 (expose `interval` on the form) or option 2 (merge over the stored
recurrence) would both now be applied in that module.

## Not yet verified

- Whether any real imported feed in use actually carries a non-1 `INTERVAL`. If
  none does, the practical impact today is limited to `until` — which the change
  proposal above will incidentally cover — and the remaining `interval` risk is
  latent rather than active.
