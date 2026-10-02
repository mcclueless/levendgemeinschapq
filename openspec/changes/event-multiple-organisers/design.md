# Design

## Context

An event stores one optional organiser slug, `organiser: z.string().min(1).optional()`
(`src/content/schema.ts`). `repository.ts` resolves it to `organiser: Organiser | null`,
and every public surface reads that single value. Projects already store
`organisers: string[]` and edit it with a native `<select multiple>`
(`organisersFrom` in `actions.ts`). `references.ts` already handles reference
fields that hold a list.

Two facts about storage shape the approach:

- `parseAll` **silently skips** a document that fails validation
  (`src/content/parse.ts`). If a stored event's fields take a shape the running
  code doesn't accept, that event disappears from the site and the admin lists,
  and nothing reports an error.
- `updateDocument` **merges** the patch over the stored frontmatter
  (`mergeDocument` in `write.ts`). Keys left out of the patch are kept, and
  `serialize` drops keys whose value is `undefined` or `""`.

Live content is in S3, so a stored-format change would apply to data outside
the repository.

## Goals / Non-Goals

**Goals:**
- No conversion of stored events, and no window during a deploy in which any
  event fails to parse.
- A rollback to the previous release never hides an event.
- Code that presents events works with one list of organisers, never with two
  fields.

**Non-Goals:**
- Changing projects, the public submission form or calendar feeds.
- An ordering among organisers other than by name.

## Decisions

### D1. Keep `organiser`, add `moreOrganisers`

Storage keeps `organiser?: string` exactly as it is and adds
`moreOrganisers?: string[]` (each entry `min(1)`). The first organiser goes in
`organiser`, the rest in `moreOrganisers`. This follows the precedent of
`event-multiple-dates`, which kept `start` and added `dates`.

Alternatives considered:
- **Rename to `organisers: string[]`, reading both forms for a while.** Old
  files stay readable. But once new code saves an event, the old code can't
  parse it, so a rollback silently hides every event saved since the deploy.
- **Let `organiser` hold a string or a list.** No new field. But a rollback
  silently hides every event with two or more organisers, because the old schema
  rejects a list.
- **An explicit main organiser plus co-organisers.** Rejected by the user: all
  organisers are equal.

With D1, old code reading a new file ignores `moreOrganisers`, because zod
strips unknown keys and the schema is not strict. The event stays visible with
its first organiser. Because saves merge, an edit under old code also keeps
`moreOrganisers` in the file.

### D2. One list at the read boundary

`repository.ts` combines the two fields into `organisers: Organiser[]` on
`CalendarEvent`, replacing `organiser: Organiser | null`. It:
- drops slugs that don't resolve, as it does today
- drops duplicates
- sorts by organiser name

Duplicates can occur after a rollback edit (D1), or from a hand-edited file.
The rest of the site never sees `moreOrganisers`. Because the type changes,
`tsc` reports every consumer that still reads `.organiser`, so none can be
missed.

`admin.ts` follows the same rule for the review queue. It joins the labels for
each slug, and keeps "Geen organisator" for none and "<slug> (onbekend)" for a
slug that doesn't resolve.

### D3. Writing from the form

The event forms post `organisers` as a list from a native `<select multiple>`,
the same control and hint as the project form. One pure helper,
`organiserFields(slugs)`:
- removes duplicates and empty values
- keeps the submitted (list) order
- returns `{ organiser, moreOrganisers }`

With no slugs it returns `{ organiser: undefined, moreOrganisers: undefined }`.
With one it returns `moreOrganisers: undefined`. Both keys are always present
in the patch, so the merge clears what an editor removed. `serialize` then
drops the `undefined` keys.

The admin actions don't check that the slugs exist, today or now. The select
only offers existing records, and the reader drops slugs that don't resolve
(D2). That's unchanged.

### D4. References: one table entry

`REFERENCE_FIELDS.event.organiser` becomes `["organiser", "moreOrganisers"]`.
`pointsAt` and `rewriteReferences` already handle list fields, so the following
cover the new field with no further code:
- permalink renames
- the hide and delete guards
- the "used by" lists

### D5. Public surfaces

- **Event page:** the "georganiseerd door …" line names each organiser as a
  link, as "A, B en C". With none, the line is omitted, as today.
- **`event-table.tsx`:** each organiser is a link, separated by commas, in the
  same cell. On narrow screens the stacked layout is unchanged.
- **`events.ts`:** the organiser filter matches when the event's organisers
  include the slug.
- **Structured data:** `organizer` is a single object for one organiser and an
  array for several. Schema.org accepts both. It is omitted for none.
- **`eventPaths`** (`revalidate.ts`): includes every organiser's page.
- **`index-build.ts`:** the index entry carries `organisers: string[]`. The
  index is derived data, rebuilt with `pnpm reindex`.

## Risks / Trade-offs

- [Old code edits an event after a rollback] → `moreOrganisers` survives the
  merge but can't be seen or edited in the old form. If the editor changes the
  first organiser to one already in `moreOrganisers`, the file holds a duplicate.
  D2 drops it on read.
- [An editor doesn't know the Ctrl/⌘ multi-select gesture] → the form shows the
  hint the project form uses. A friendlier picker would be a separate change for
  both forms.
- [The type change touches many files] → this is intended. The compiler lists
  every consumer, and the tests cover the helpers in D2 and D3.

## Migration Plan

None. Deploy as usual. Existing events are read unchanged. Rolling back is safe:
events stay visible and show their first organiser.
