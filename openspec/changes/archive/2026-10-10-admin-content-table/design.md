# Design

## Context

The backend today:
- **Shell:** `AdminShell` is a dark top bar with four links (Overzicht,
  Wachtrij, Galerij, Agenda-feeds) and Uitloggen. Each of the 13 backend pages
  wraps itself in it. There is no `layout.tsx` and no `loading.tsx` under
  `/beheer`.
- **List:** `/beheer/<segment>` calls `listContent(type)` and renders one card
  per item with its status and title. `ContentListItem` has no other fields.
- **Reads:** `readPrefix` is one listing plus one read per document, then
  `parseAll`. Nothing is kept between requests. The site runs on Amplify
  (Lambda), so process memory is not a dependable cache.
  - the dashboard reads all five types in full to show six numbers
  - the list reads its whole type
  - a blocked hide or delete reads four types again in `findReferences`
- **Last modified:** not stored in the documents. `StoredDoc` is `key`, `slug`
  and `raw`.
- **After an action:** hide, publish, delete and the update actions redirect
  to `adminListPath(type)`, with `?blocked=` or `?undeletable=` when refused.
- **Access:** `middleware.ts` guards `/beheer/*` except `/beheer/login`, and
  every page also calls `requireAdmin()`.

The public agenda already has a table that stacks into labelled blocks on a
phone (`event-table.tsx`, event-list-table-view D5), and the public header has
a menu control that works without JavaScript (mobile-navigation-menu).

## Goals / Non-Goals

**Goals:**
- An item can be found by search, filter or sort without scrolling a long page.
- Every backend section is one click away from every backend page.
- The list works without JavaScript, as the backend forms do.
- List data comes from one function, so a faster source can replace the reads
  later without touching the pages.
- Nothing about stored content changes.

**Non-Goals:**
- A stored index or cache. See D2.
- Preview of unsaved changes, bulk actions, a queue count in the sidebar.
- Changing what the forms, queue, gallery or feeds pages do.

## Decisions

### D1. The shell becomes a layout in a route group

The backend pages move to `src/app/beheer/(shell)/`, with a `layout.tsx` that
renders the navigation around them. A route group does not appear in the
address, so every URL stays the same. `login/` stays outside the group, so the
login page has no navigation. `actions.ts`, `body-actions.tsx` and
`api/address-suggest/` stay where they are, and pages import the actions as
`@/app/beheer/actions`.

- The layout does not re-render when moving between backend pages, so the
  navigation stays in place and only the content area changes.
- The layout holds the loading placeholder for the content area (D8), which
  the login page therefore does not get.
- Every page keeps its `requireAdmin()` call. A layout is not re-run on
  navigation, so it must not be the only check.
- The pages drop their `<AdminShell>` wrapper.

Alternative considered: keep the wrapper on each page and add `loading.tsx`
per page. The navigation would be redrawn on every click, and there would be
no one place to show that a page is loading.

### D2. One summaries function, reading documents for now

A new `src/content/summaries.ts` exports `listSummaries(type)`, wrapped in
React `cache()` so one request reads a type once. A summary holds what lists
and checks need, and no body:

| Field | For |
|---|---|
| `type`, `slug`, `title`, `status`, `href` | every type |
| `modified` | every type, see D3 |
| `venues`, `organisers` | the slugs the item points at, see below |
| `start`, `end`, `recurrence`, `dates`, `noPage` | events |
| `date` | blog posts, projects |
| `author` | blog posts |
| `address` | locations |

`venues` and `organisers` are filled from `REFERENCE_FIELDS` by a new helper in
`references.ts`, `referencedSlugs(frontmatter, kind, type)`. `pointsAt` is
rewritten on top of it, so there is still one definition of what counts as a
reference.

These read summaries:
- `listContent(type)`, which now returns the summaries
- `getContentCounts()`
- `findReferences()`

These keep reading full documents, because they need bodies:
`getPendingSubmissions()`, `findImageReferences()`, `getEditable()`.

`listSummaries` logs one line per read: the type, the number of documents and
the time taken. On the live site that goes to the Lambda log.

A stored index is not built now. The site has about 20 items and is not slow,
and the reads already run in parallel. The log shows when that changes. An
index checked against the S3 listing's ETags would then replace the body of
`listSummaries` only.

Alternative considered: update `.index.json` on every write. A feed sync
writing 50 events would rewrite it 50 times, and two Lambdas saving at once
could lose each other's update.

### D3. Last modified comes from the store

`StoredDoc` gains `modified?: Date`:
- `S3Store`: `LastModified` from `ListObjectsV2`, which `readPrefix` already
  calls
- `LocalFsStore`: the file's `mtime`

No document changes. The time is that of the last write of any kind, including
a hide, a permalink rewrite or a feed sync.

Alternative considered: a `modified` frontmatter field. It would need every
write path to set it, and old documents would have none.

### D4. The view is in the address, and the server does the work

The list page reads these search parameters, filters and sorts the summaries
on the server, and renders one page of rows:

| Parameter | Values | Default |
|---|---|---|
| `status` | `published`, `draft`, `pending` | all |
| `q` | search text | none |
| `periode` | `aankomend`, `geweest` (events) | all |
| `locatie` | a location slug (events, projects) | all |
| `organisator` | an organiser slug (events, projects) | all |
| `sort` | `titel`, `datum`, `status`, `gewijzigd` | as today |
| `dir` | `asc`, `desc` | per column |
| `pagina` | a page number | 1 |

- **Parsing** is a pure function, `parseListQuery(type, searchParams)`. Unknown
  or invalid values fall back to the default. A page past the end shows the
  last page.
- **Applying** is a pure function, `applyListQuery(type, summaries, query, today)`,
  returning the rows of the page, the total, and the count per status.
- **Search** matches the title or name, ignoring case and accents.
- **Status counts** are for the whole type, not the filtered result, so the
  tabs do not change as you search.
- **The "In wachtrij" tab** is shown only for events and blog posts, the two
  types that can be pending.
- **Default order** is unchanged: events by start and blog posts and projects
  by date, newest first; locations and organisers by name.
- **An upcoming event** is one with a date today or later: its `start`, any of
  its `dates`, or a recurrence that has no end or ends today or later. A pure
  helper decides this from the summary.
- **Controls** are a `GET` form (search box, selects, a "Filteren" button) and
  links (tabs, column headers, page numbers). Nothing needs JavaScript.
- **Page size** is 25.

Alternative considered: send all rows to the browser and filter there. It
needs JavaScript, and the page grows with the content.

### D5. The table

A real `<table>` with a header row, stacking into labelled blocks in the way
`event-table.tsx` does. It stacks below the `xl` width, not only on a phone:
beside the sidebar the columns do not fit before that.

- **Columns** per type, as in the proposal. Projects also show their date, as
  "Aangemaakt", so that the column they are ordered by can be chosen. Location and organiser cells show
  names, looked up from the location and organiser summaries. A slug with no
  record shows as "<slug> (onbekend)", as the queue does.
- **Event date cell:** the start, plus the recurrence label or the number of
  further dates. A marker (`noPage`) shows a "Geen pagina" badge.
- **Sortable headers** are links that set `sort` and `dir`, and the sorted
  column carries `aria-sort`.
- **Row actions** are the existing forms and `ConfirmButton`s, shown as text
  links under the title. "Bekijken" is added for a published item that has a
  page, so not for a marker.
- **Empty states:** "Nog niets aangemaakt" for an empty type, and "Niets
  gevonden" with a link that clears the filters.

### D6. Actions return to the view they came from

The list adds a hidden `terug` field to its hide, publish and delete forms,
holding the current list address with its parameters. The edit link carries
the same value as `?terug=`, and the edit form passes it on as a hidden field.

A helper, `returnPath(value, fallback)`, resolves the value as a URL against a
fixed dummy origin and accepts it only if the origin is unchanged and the
resolved path starts with `/beheer/`. Resolving first means `..` segments,
backslashes and `//host` forms are judged by where they lead, not by how they
are spelled. Otherwise it returns the fallback, which is today's
`adminListPath(type)`. The actions redirect to the resolved path and query. A
refused hide or delete adds `blocked` or `undeletable` to it.

Only the backend's own actions change: `hideContent`, `showContent`,
`deleteContent` and the update actions. The public admin banner has its own
action wrappers around the shared `performHide` and `performDelete`, and they
keep returning to the public listing, as the admin-presence spec requires.

### D7. Navigation and the menu control

The layout renders the dark admin chrome as a sidebar on wide screens. Its
entries are grouped: Overzicht; the five content types; Wachtrij, Galerij and
Agenda-feeds; Uitloggen. Import stays reachable from the feeds page, as now.

A small client component marks the current section with `aria-current="page"`
from `usePathname()`. A content type's entry is current on its list, its edit
form and its create form.

On a narrow screen the sidebar is replaced by a bar with a menu control that
follows the rules of the public header's control: labelled, reports whether it
is open, opens without JavaScript, and closes on following a link, on Escape
and on activating something outside it.

The sidebar shows no counts. A count of waiting submissions would add a read
of all events and blog posts to every backend page.

### D8. Loading placeholders

The layout wraps the content area in a small client component,
`PendingContent`. When a link to another backend page is followed, it shows a
placeholder in the content area at once, and removes it when the address has
changed: a table-shaped one for a management list, a neutral one otherwise.
The placeholder is announced as loading to assistive technology, and its pulse
is switched off by the site's `prefers-reduced-motion` rule.

Alternative tried and dropped: `loading.tsx` files. They stream the page
behind a fallback that only JavaScript swaps out, so with scripts off every
backend page stayed on "Laden…". That broke the goal that the list works
without JavaScript. With `PendingContent` the server always sends the whole
page, and the placeholder is something JavaScript adds while it navigates.

## Risks / Trade-offs

- [Search and filters read the whole type on every load] → this is what
  happens today for the list. The page is smaller than before, and the read
  times are logged. D2 leaves one place to add an index.
- [Moving the pages breaks a relative import or a link] → addresses do not
  change. `pnpm typecheck` catches imports, and a task visits every backend
  page.
- [A crafted `terug` value redirects elsewhere] → `returnPath` accepts only
  paths under `/beheer/`, and is unit-tested with hostile values.
- ["Last modified" changes when a feed sync or a permalink change rewrites a
  document] → it is the time of the last write, which is what the column says.
- [A rollback] → nothing stored changes, so the old code runs on the same
  content.

## Migration Plan

None. No stored content changes and no address changes.

## Open Questions

- Should the filters apply as soon as a select changes, with JavaScript, in
  addition to the "Filteren" button? Left out for now.
