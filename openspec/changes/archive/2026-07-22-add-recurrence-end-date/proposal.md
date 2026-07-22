## Why

A recurring event can be marked *Wekelijks* or *Maandelijks*, but there is no
way to say when it stops. `RecurrenceSchema` has always carried an optional
`until`, and the expansion logic (`occurrencesInRange`, `nextOccurrence`) already
honours it — but no form writes it, so in practice every hand-authored recurring
event repeats forever. The `events` spec already promises the behaviour
("Scenario: Ending recurrence"); today that scenario is only reachable through an
iCal import, never through the UI.

Separately, the public submission form at `/evenement-indienen` has no recurrence
control at all. A neighbourhood group running a weekly repair café has to submit
a single occurrence and hope an administrator converts it. Since these submitters
are exactly the people running the recurring activities, they should be able to
say so — the item still lands in the approval queue unpublished, so an
administrator remains the gate.

## What Changes

- Add a **recurrence end date** to the admin event **create** and **edit** forms,
  shown alongside the existing *Herhaling* selector. It is **required whenever a
  frequency is chosen** — an event may be non-repeating, or it may repeat with a
  stated end, but the forms no longer allow authoring an open-ended series.
- Add a **Herhaling selector and the same required end date** to the **public**
  event submission form at `/evenement-indienen`. The public form offers a
  **narrower frequency set than the backend: non-repeating or weekly only.**
  Monthly remains administrator-only; an administrator can widen a submission on
  approval. Public submissions continue to be written as `pending` and continue
  to require approval — the approval gate is unchanged.
- Persist the end date into the existing `recurrence.until` frontmatter field.
  **No schema change**: `until` stays *optional in the schema* and becomes
  *required at the form layer only* — see Impact, this distinction is load-bearing.
- Reject a save when the recurrence end date is missing, or is earlier than the
  event's start, on both paths.
- Show the recurrence end date on the admin **approval queue** entry, so a
  reviewer can see the full series a submitter is proposing.
- Leave `interval` pinned at `1` on both forms. "Every 2 weeks" stays out of
  scope.

## Capabilities

### Modified Capabilities

- `events`: A repeatable event's recurrence carries an end date, after which no
  further occurrences are presented. An editor authoring a repeatable event SHALL
  supply one. A recurrence with no end date remains valid and open-ended for
  documents that already exist or arrive by import. The recurrence end date is
  distinct from the event's optional end date/time, which bounds a single
  occurrence.
- `editorial-backend`: The admin event create and edit forms expose a required
  recurrence end date next to the recurrence interval. The public event
  submission form exposes a non-repeating/weekly interval choice and the same
  required end date, and its submissions still enter the approval queue
  unpublished.

## Impact

- **Schema stays as-is — deliberately.** `RecurrenceSchema.until` remains
  `.optional()`. Making it required in zod would invalidate every existing
  open-ended recurring document (`content/events/repair-cafe.mdx` has `freq:
  weekly` with no `until`), and `parseAll` *skips* documents that fail
  validation — so tightening the schema would silently remove those events from
  the site. It would also break iCal import, since an `RRULE` without `UNTIL` is
  legal and `mapRecurrence` maps it to `until: undefined`. "Required" is
  therefore enforced in the two server actions, not in `schema.ts`.
- **Admin forms**: `src/app/beheer/nieuw/evenement/page.tsx` and
  `src/app/beheer/[type]/[slug]/bewerken/page.tsx` — one new date input beside
  the existing `Herhaling` select; the edit form prefills it from the stored
  `recurrence.until`.
- **Admin action**: `src/app/beheer/actions.ts` — `recurrenceFrom()` reads the
  new field, requires it when a frequency is set, and validates it against the
  start; `createEvent`/`updateEvent` gain the error redirects.
- **Public form**: `src/app/evenement-indienen/page.tsx` gains a two-option
  `Herhaling` select and the end-date input;
  `src/app/evenement-indienen/actions.ts` gains recurrence parsing, rejects
  `monthly` if it arrives, and writes `recurrence` into the document it already
  creates.
- **Approval queue**: `src/content/admin.ts` (`PendingEvent.recurrence` widens
  from `"weekly" | "monthly"` to also carry the end date) and
  `src/app/beheer/queue/page.tsx` render.
- **Unchanged**: `src/content/schema.ts`, `src/content/recurrence.ts`,
  `src/content/repository.ts`, `src/content/ical-import.ts`.
- **One editorial consequence, no data migration.** Existing open-ended events
  keep working untouched. But the first time an administrator *edits* one, the
  form will require an end date before it can be saved — an existing
  indefinite series must be given an end at that point. Affects
  `content/events/repair-cafe.mdx` today.

## Non-Goals

- **Editable `interval`.** Both forms keep writing `interval: 1`.
- **Monthly recurrence on the public form.** Backend only.
- **Retro-fitting end dates onto existing open-ended events.** No migration; they
  are only affected when next edited.
- **The edit-path recurrence clobber.** `updateEvent` replaces the whole
  `recurrence` object, destroying an iCal-imported `interval` on save. That is a
  pre-existing defect against `editorial-backend` ("SHALL preserve frontmatter
  fields not present on the edit form") and is tracked separately in
  `docs/bugs/recurrence-edit-clobber.md`. This change adds an `until` input,
  which incidentally stops `until` from being lost — but the underlying
  wholesale-replacement bug remains and is not fixed here.
- Daily or yearly recurrence, count-based rules (`COUNT`), or per-occurrence
  exceptions.
- Raising `MAX_OCCURRENCES` (60) in `src/content/recurrence.ts`.
