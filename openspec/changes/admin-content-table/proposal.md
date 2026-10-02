## Why

The backend is hard to find things in. A content type's list shows only each
item's status and title, on one long page, with no search, filter, sorting or
paging. The five content types are not in the navigation, so they can only be
reached through the tiles on the dashboard. The site holds about 20 items now,
and calendar feeds will take it past 100. The editor asked for an admin that
works more like WordPress: a table to find items in, and navigation that
reaches everything.

## What Changes

- **Navigation:** a sidebar that is on every backend page and reaches every
  section:
  - Overzicht
  - Evenementen, Locaties, Organisatoren, Blogposts, Projecten
  - Wachtrij, Galerij, Agenda-feeds
  - Uitloggen

  It marks the section you are in. On a narrow screen it sits behind a menu
  control.
- **A table per content type**, replacing the cards:
  - **Columns for every type:** title or name, status, last modified.
  - **Extra columns per type:**
    - events: date, location, organisers
    - blog posts: date, author
    - projects: location, organisers
    - locations: address
    - organisers: location
  - **Row actions:** edit, hide or publish, delete, and "Bekijken" for a
    published item that has a public page.
- **Finding items:**
  - status tabs with a count each: all, published, hidden, in the queue
  - a search box on the title or name
  - filters per type: events by period (upcoming or past), location and
    organiser; projects by location and organiser
  - sortable columns
  - 25 items per page
- **The list remembers where you were.** Search, filters, sorting and page are
  in the address, so they survive a reload and the back button. After editing,
  hiding, publishing or deleting an item you return to the same view.
- **Loading feedback:** a backend page shows a placeholder at once while its
  content loads, and the sidebar stays in place.
- **One way of reading list data.** The table, the dashboard counts and the
  hide and delete checks read item summaries through one function. It also
  records how long each read took, so the numbers from the live site show when
  a faster source is needed.

Not in scope:
- a stored index or cache of the content; the summary function is where one
  would go later, once the recorded read times call for it
- previewing unsaved changes, and viewing a hidden item as a page; a separate
  change
- bulk actions on several rows at once
- a count of waiting submissions in the sidebar; it stays on the dashboard
- changes to the create and edit forms, the queue, the gallery or the feeds
  pages, other than how they are reached

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editorial-backend`:
  - **List existing content for management** becomes a table with more
    columns, and covers projects.
  - new requirement: **finding content in the management list**
  - new requirement: **sorting and paging the management list**
  - new requirement: **the management list keeps its view**
  - new requirement: **backend navigation**
  - new requirement: **loading feedback in the backend**
- `design-system`:
  - **Admin chrome visual token** names the backend navigation in place of the
    backend top bar.
- `accessibility-compliance`:
  - **Admin chrome accessibility** names the backend navigation in place of
    the backend top bar.

## Impact

- `src/content/`:
  - a new summaries module, the one read path for list data
  - `storage.ts`: a stored document carries its last-modified time
  - `admin.ts`: the list, the counts and the reference checks read summaries
  - `references.ts`: a helper that returns the slugs a document points at
- `src/app/beheer/`:
  - the pages move into a route group with a shared layout. Addresses do not
    change. The login page stays outside it.
  - `[type]/page.tsx`: the table, tabs, search, filters, sorting and paging
  - `actions.ts`: hide, publish, delete and the update actions return to the
    view they came from
  - a shared layout that shows a placeholder while a page loads
- `src/components/admin/`: `AdminShell` becomes the sidebar layout, with a
  small client component for the current-section mark and the menu control.
- Unchanged: stored content, public pages, the forms' fields. No new
  dependency.
