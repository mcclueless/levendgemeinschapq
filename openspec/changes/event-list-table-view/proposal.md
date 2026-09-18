## Why

Events on the homepage and `/agenda` are shown only as a grid of image cards.
Cards suit browsing, but they make it slow to scan dates, times, and places, and
the homepage stops at six events with no way to see more without leaving the page.
Visitors asked to switch to a table and to load more events where they are.

## What Changes

- The event listings on the **homepage** and **`/agenda`** get a view switch:
  **Kaarten** (the current cards, still the default) and **Tabel**.
- The table shows date, time, event, location, organiser, and how often it
  repeats. On a phone each row stacks into a block, and no field is dropped.
- A **Meer laden** control adds the next batch of events in place, in either
  view: 6 at a time on the homepage, 12 on `/agenda`.
- The chosen view and the number shown live only in the URL
  (`?weergave=tabel&aantal=12`). Nothing is stored, so a new visit starts on cards.
  Links keep working without JavaScript, and Back returns to the same view.
- The homepage listing looks 90 days ahead, as `/agenda` already does, so loading
  more is not flooded with a year of weekly repeats.
- **Behaviour change:** `/agenda` shows its first 12 events and loads more on
  request, where it used to render every event in the 90 days at once.

Not in scope: remembering the choice between visits, the event listings on
location and organiser pages, and sorting or filtering the table.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `events`: **Listing display variants** gains a table variant. A new requirement
  covers the visitor-facing view switch and loading more on the homepage and
  agenda.
- `homepage`: **Homepage section order** no longer freezes the event listing's
  limit, which now starts at six and loads more within 90 days.

## Impact

- `src/components/events/`: a table variant for `EventList`, a view switch, and a
  load-more control.
- `src/components/events/upcoming-events.tsx`: optional switchable mode used by the
  homepage; location and organiser pages are unchanged.
- `src/app/page.tsx` and `src/app/agenda/page.tsx`: read `weergave` and `aantal`.
- A small pure module parsing and building the listing URL, with unit tests.
