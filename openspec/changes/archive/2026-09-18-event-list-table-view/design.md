## Context

The homepage renders `<UpcomingEvents limit={6} variant="image">`. `/agenda` calls
`getUpcomingEvents({ horizonDays: 90 })` and renders every occurrence with
`<EventList variant="image">`. Both pages are server components rendered per
request (`force-dynamic`). `getUpcomingEvents` already takes a `limit` and
returns `total` and `hasMore`. `EventList` has `image` and `text` variants; the
`text` variant is used nowhere public.

Decisions taken with the site owner: cards ↔ table; homepage and `/agenda`; the
choice resets on a new visit; load more on demand in both views; `/agenda` pages
within its 90 days; the homepage also looks 90 days ahead.

## Goals / Non-Goals

**Goals:**
- A table that is quicker to scan than cards, readable on a phone.
- View and count survive loading more, a shared link, and Back.
- Everything works without JavaScript and stays server-rendered.

**Non-Goals:**
- Remembering the choice between visits.
- Sorting, filtering, or column selection.
- Controls on Venue and Organiser pages.

## Decisions

### D1. State lives in the URL: `weergave` and `aantal`

`?weergave=tabel&aantal=12`. Defaults are left out of the URL, so the plain `/`
and `/agenda` stay the canonical forms. A small pure module parses and builds
these URLs:
- An unknown `weergave` means cards.
- `aantal` must be a positive whole number. Otherwise the page's initial count is
  used, and it is clamped to 1–500.

*Why the URL:* the pages are server-rendered per request, so the server already
has the parameters. Nothing is stored, which is the "reset" the owner asked for,
and adds no cookie-policy question. Back from an event page restores the view.

*Alternatives:*
- A client toggle with React state: it needs JavaScript, loses its state on Back,
  and every page would ship both views.
- localStorage: this is exactly the persistence that was declined.

Both pages already set a canonical URL (`/`, `/agenda`), so parameter variants are
not duplicate content.

### D2. Controls are links, with `scroll={false}`

The view switch and "Meer laden" are `next/link` links to the same path with new
parameters, plus the fragment `#evenementen`.
- With JavaScript, Next.js does a soft navigation, re-renders the server component,
  and keeps the scroll position.
- Without it, the browser loads the page and jumps to the listing.

There is no route handler, no client-side data fetching, and no client component.

*Trade-off:* each "Meer laden" re-renders the whole list rather than appending.
With at most 90 days of events, that is a small payload, and it keeps a single
rendering path.

### D3. Loading more raises the count

`aantal` is the total shown, not a page number. "Meer laden" links to
`aantal + batch`. The list is always "the first N", so a reload or a shared link
gives the same result, and there is no page state to reconcile. The batch is 6 on
the homepage and 12 on `/agenda`.

### D4. The homepage looks 90 days ahead

The homepage used `getUpcomingEvents`' default of 365 days. With load more, a
weekly event would contribute 52 repeats and crowd everything else out. Using the
agenda's 90 days bounds it. Past that, the existing "Meer evenementen bekijken"
link to `/agenda` still applies. The homepage spec's "limits unchanged" clause is
modified accordingly.

### D5. One table, stacked on phones with explicit roles

`EventList` gains `variant="table"`, a real `<table>` with a visually hidden
`<caption>` and `<th scope="col">`. Below the `sm` breakpoint, rows and cells are
set to `display: block`, and each cell shows a small inline label. The header row
is hidden there, because the inline labels replace it.

Setting `display` on table elements strips their table semantics in some browsers
(notably Safari). So the elements also carry explicit `role`s: `table`, `row`,
`columnheader`, `cell`. The inline labels are `aria-hidden`, so a screen reader
does not hear each label twice.

The columns:
- **Datum:** `formatDate`.
- **Tijd:** start, plus end when the event has one. The end is derived by adding
  the event's own duration to this occurrence's start, so recurring occurrences
  get the right end.
- **Evenement:** links to the event.
- **Locatie:** links to the venue.
- **Organisator:** links to the organiser.
- **Herhaling:** `recurrenceLabel`, or "—" when the event does not repeat.

### D6. The switch announces the active view; the count is a live status

The switch is a `role="group"` labelled "Weergave". Its two links mark the active
one with `aria-current="true"` and a filled style.

Below the list, a `role="status"` line reads "12 van 20 evenementen getoond". After
"Meer laden", a screen reader hears the new count. When everything has been
loaded, the "Meer laden" link disappears, and the status line still tells the
visitor where they are.

### D7. Where the parts live

- `src/lib/listing-view.ts` (pure): parse the parameters, build hrefs.
- `src/components/events/event-table.tsx`: the table.
- `src/components/events/listing-controls.tsx`: the view switch, "Meer laden", and
  the status line. Server components with no client code.
- `UpcomingEvents` gains an optional `switchable` prop carrying the parsed view,
  count, base path, and batch. Venue and organiser pages do not pass it, so they
  are unchanged.
- `/agenda` renders the controls around `EventList` itself, because it already
  fetches its own data and shows `total` in its intro.

## Risks / Trade-offs

- **[Soft navigation drops focus]** When "Meer laden" disappears after the last
  batch, keyboard focus can fall back to the page. → The status line announces the
  new count, and the list keeps its place. Accepted for a read-only listing.
- **[Agenda no longer shows everything at once]** A visitor used to scrolling the
  whole quarter now has to load more. → The intro still states the total, and the
  status line shows progress.
- **[Homepage can show fewer than six]** If fewer than six events fall within 90
  days, the homepage shows fewer than before. → Accepted by the owner; the agenda
  link remains.

## Migration Plan

No data changes. Deploy, then check both pages in each view on desktop and phone
widths. Rollback is a revert.
