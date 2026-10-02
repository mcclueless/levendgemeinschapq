# Tasks

## 1. Storage and reading (D1, D2)

- [x] 1.1 Add optional `moreOrganisers: z.array(z.string().min(1)).optional()`
      to the event schema in `src/content/schema.ts`, leaving `organiser`
      unchanged. Verify with a test that an event file with only `organiser`
      parses, one with both parses, and an unknown frontmatter key is stripped
      rather than rejected (the guarantee that keeps a rollback safe, D1).
- [x] 1.2 Add a pure helper that turns `organiser` + `moreOrganisers` and a slug
      → Organiser map into `Organiser[]`: drop unresolved slugs and duplicates,
      sort by name. Test none, one, several, a duplicate, and an unknown slug.
- [x] 1.3 Replace `organiser: Organiser | null` with `organisers: Organiser[]`
      on `CalendarEvent` (`types.ts`) and build it in `repository.ts` with the
      helper. Verify that `pnpm typecheck` then lists the consumers fixed in
      group 3.

## 2. Writing and references (D3, D4)

- [x] 2.1 Add a pure `organiserFields(slugs)` helper that returns
      `{ organiser, moreOrganisers }`, always with both keys, `undefined` where
      empty, de-duplicated, keeping submitted order. Test none, one, several and
      duplicates, and test through `mergeDocument` that saving fewer organisers
      clears `moreOrganisers` from a stored file.
- [x] 2.2 Use it in `createEvent` and `updateEvent` (`src/app/beheer/actions.ts`),
      reading `formData.getAll("organisers")`.
- [x] 2.3 Add `moreOrganisers` to `REFERENCE_FIELDS.event.organiser` in
      `references.ts`. Extend `references.test.ts`: an event naming an organiser
      only in `moreOrganisers` points at it, and a rename rewrites it there while
      keeping order.

## 3. Admin forms and queue

- [x] 3.1 On the new-event page and the event branch of the edit page, replace
      the organiser `Select` with a multi-select named `organisers` (not
      required), with the project form's hint, preselecting the event's current
      organisers on edit. Verify in the app that creating with two organisers,
      editing down to one, and editing to none store the expected fields.
- [x] 3.2 In `src/content/admin.ts`, give the queue a joined organiser label for
      all of an event's slugs, keeping "Geen organisator" and
      "<slug> (onbekend)". Test an event with one known and one unknown slug.

## 4. Public surfaces (D5)

- [x] 4.1 Event page (`src/app/agenda/[slug]/page.tsx`): list every organiser
      as a link in the "georganiseerd door" line ("A, B en C"), and no line
      when there are none.
- [x] 4.2 `event-table.tsx`: each organiser as a link in the organiser cell,
      separated by commas.
- [x] 4.3 `events.ts`: the organiser filter matches any of the event's
      organisers. Add a test that an event with two organisers is listed for
      each of them.
- [x] 4.4 `structured-data.ts`: one `organizer` object for one organiser, an
      array for several, none for none. Add a test for the three cases.
- [x] 4.5 `eventPaths` in `revalidate.ts` and the event entry in
      `index-build.ts` cover every organiser. Verify that `pnpm typecheck` is
      clean, so no `.organiser` consumer is left.

## 5. Verify

- [x] 5.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [x] 5.2 In the running app: give an existing event two organisers, then check
      the event page, the agenda table, both organiser pages and the page's
      structured data. Check that an event stored before the change still shows
      its organiser, that the public submission form still offers one organiser,
      and that an organiser listed only in `moreOrganisers` can't be deleted.
      Restore any content files the check changed.
