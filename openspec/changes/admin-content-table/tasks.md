# Tasks

## 1. Summaries: one read path (D2, D3)

- [x] 1.1 Add `modified?: Date` to `StoredDoc`, filled from `LastModified` in
      `S3Store` (carried from the listing `readPrefix` already makes) and from
      the file's `mtime` in `LocalFsStore`. Verify with `pnpm typecheck` that
      existing callers are unchanged.
- [x] 1.2 Add `referencedSlugs(frontmatter, kind, type)` to `references.ts`
      and rewrite `pointsAt` on top of it. Test scalar and list fields for
      every referrer kind; the existing `references.test.ts` still passes.
- [x] 1.3 Add `src/content/summaries.ts` with the `ContentSummary` type, a
      pure `toSummary(type, parsedDoc, modified)` and a `cache()`-wrapped
      `listSummaries(type)` that logs the type, document count and time
      taken. Test `toSummary` for each of the five types, including an event
      with `moreOrganisers`, a marker, and a document without `modified`.
- [x] 1.4 Make `listContent`, `getContentCounts` and `findReferences` in
      `admin.ts` read summaries. Verify in the app that the dashboard counts
      are unchanged, and that hiding and deleting a referenced location is
      still refused with the same list of referrers.

## 2. The list view logic (D4, D6)

- [x] 2.1 Add a pure `parseListQuery(type, searchParams)`. Test defaults,
      every parameter, invalid values falling back, and filters that do not
      apply to the type being ignored.
- [x] 2.2 Add a pure helper that decides whether an event summary is upcoming.
      Test a past single date, a future one, further `dates` with one in the
      future, a recurrence without an end, and one that ended yesterday.
- [x] 2.3 Add a pure `applyListQuery(type, summaries, query, today)` returning the
      page of rows, the total matched and the count per status. Test status,
      search ignoring case and accents ("cafe" finds "Repair Café"), period,
      location and organiser filters, each sort in both directions, the
      default order per type, 25 per page, and a page past the end.
- [x] 2.4 Add a pure `returnPath(value, fallback)`. Test a list address with
      parameters, and that an absolute URL, a `//host` value, a path outside
      `/beheer/`, `/beheer/../agenda`, `/beheer\evil.example` and an empty
      value all give the fallback.

## 3. Shell and navigation (D1, D7, D8)

- [x] 3.1 Move the backend pages into `src/app/beheer/(shell)/`, leaving
      `login/`, `actions.ts`, `body-actions.tsx` and `api/` in place. Import
      the actions as `@/app/beheer/actions`. Add `(shell)/layout.tsx` and
      remove the `<AdminShell>` wrapper from each page. Verify with
      `pnpm typecheck`, and by opening every backend page at its unchanged
      address.
- [x] 3.2 Rebuild `AdminShell` as the sidebar layout in the admin chrome,
      with the grouped entries and Uitloggen, and a client component that
      marks the current section with `aria-current="page"` and by more than
      color. Verify the mark on a list, an edit form and a create form.
- [x] 3.3 Add the menu control for narrow screens, following the public
      header's control. Verify at phone width: it opens without JavaScript,
      reports its state, and closes on following a link, on Escape and on
      activating something outside it.
- [x] 3.4 Add `PendingContent` to the layout: a placeholder in the content
      area from the click on a backend link until the address changes,
      table-shaped for a list (D8; `loading.tsx` was dropped because it leaves
      pages on the placeholder without JavaScript). Verify that the navigation
      stays in place while a page loads, that the login page has none, that a
      page loads in full with JavaScript disabled, and that the placeholder
      respects `prefers-reduced-motion`.

## 4. The table (D4, D5)

- [x] 4.1 Build the table for `/beheer/<segment>` from `applyListQuery`: the
      columns per type, names for locations and organisers with "(onbekend)"
      for a missing record, the event date cell, sortable headers with
      `aria-sort`, and phone stacking as in `event-table.tsx`.
- [x] 4.2 Add the status tabs with counts ("In wachtrij" only for events and
      blog posts), the search and filter form, the page controls with the
      total, and the two empty states.
- [x] 4.3 Keep the existing row actions and notices (`blocked`,
      `undeletable`, `geo`), and add "Bekijken" for a published item that has
      a page.

## 5. Returning to the view (D6)

- [x] 5.1 Add the `terug` field to the hide, publish and delete forms, and
      make `hideContent`, `showContent` and `deleteContent` redirect to
      `returnPath`, adding `blocked` or `undeletable` when refused. Leave the
      public admin banner's actions as they are, and verify that hiding an
      event from its public page still lands on `/agenda`.
- [x] 5.2 Carry `terug` on the edit link and through the five edit forms, and
      make the update actions redirect to `returnPath` on success. Error
      redirects back to the form keep `terug`.

## 6. Verify

- [x] 6.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [x] 6.2 With `pnpm dev` running (no `pnpm build`), add about 60 generated
      event files to `content/events/`. Check: paging and totals, each sort,
      status tabs and their counts, search, the period, location and
      organiser filters, and that hiding an item on page 2 of a filtered list
      and editing one both return to the same view. Check the read-time line
      appears in the server log. Remove the generated files afterwards and
      restore any content files the checks changed.
- [x] 6.3 Check each of the five lists and the navigation at phone width, by
      keyboard only, and with JavaScript disabled.
