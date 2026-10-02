## Why

Many neighbourhood events are put on by more than one group: a choir and a
community centre, a garden collective and a repair café. An event can name only
one organiser today, so the others are left out of the event page and the event
is missing from their organiser pages. Projects already allow several
organisers; events should too.

## What Changes

- An event can have **any number of organisers, including none**. They are
  equal: none is the main one, and they are shown in alphabetical order.
- The **admin create and edit forms** for events replace the single organiser
  drop-down with a multi-select, the way the project form works. Selecting none
  is allowed.
- On the public site:
  - the **event page** links every organiser
  - the **event table** names every organiser in its organiser column, each
    linking to its page
  - the event appears on **every one of its organisers' pages**
  - the event's **structured data** lists every organiser
- In the backend:
  - the review queue names every organiser
  - renaming an organiser's permalink updates every event that lists it
  - an organiser listed on any event counts as still in use, so it can't be
    hidden or deleted
- **Storage is backward compatible.** The existing `organiser` field keeps its
  form and meaning. The others go in a new optional list. Event files that
  already exist stay valid and need no conversion, and a rollback can't make
  events disappear.

Not in scope:
- The **public submission form** keeps exactly one organiser. Co-organisers can
  be added when the event is reviewed.
- **Calendar feeds** keep one default organiser for the events they import.
- A "main" organiser, or a meaningful order among organisers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `events`:
  - **Event entity and fields**: an event has zero or more organisers instead
    of zero or one.
  - **Venue and Organiser selection**: the organiser selector allows several
    choices or none.
  - **Listing display variants**: the table's organiser column names and links
    every organiser.
  - **Single event view**: the page links every organiser.
- `organisers`:
  - **Upcoming events for the organiser**: an organiser's page lists every
    upcoming event that names it among its organisers.

## Impact

- `src/content/schema.ts`: a new optional `moreOrganisers` list on events.
- `src/content/repository.ts`, `src/content/types.ts`: events are read with a
  list of organisers instead of a single one.
- `src/content/references.ts`: the new field is added to the reference table,
  which permalink renames and the hide and delete guards read.
- Admin: the event create and edit forms and their actions in
  `src/app/beheer/actions.ts`, and the review-queue data in
  `src/content/admin.ts`.
- Public: the event page, `event-table.tsx`, the organiser filter in
  `events.ts`, structured data, `revalidate.ts`, and `index-build.ts`.
- Unchanged: the public submission form, calendar import, and the stored form
  of every existing event. No new dependency.
