# Design

## Context

Every published event currently gets:
- a page at `/agenda/<slug>`, served by `getEvent`
- a sitemap entry, built from `getAllEvents()` hrefs
- a link in each listing variant: `EventCard` and `EventRow` in
  `event-card.tsx`, and the title cell in `event-table.tsx`

Cards crop the image (`h-44 object-cover`) and show `formatWhen` with a time.
The admin event form is a server component. Its start and further-date fields
are `datetime-local`. `DateListField` is a client component. The cover image
arrives as `featuredImageUrl` (picked) or `image` (uploaded). The field has no
way to remove an image, so an event that has one keeps it.

Like `moreOrganisers`, a new field must not make existing files invalid.
`parseAll` skips invalid documents, and zod strips keys it doesn't know.

## Goals / Non-Goals

**Goals:**
- One flag decides marker behaviour, in one place per surface.
- The form works without JavaScript, and is easier with it.
- Turning a marker back into an event loses nothing.

**Non-Goals:**
- All-day ordinary events, yearly repeats, or markers from the public form or
  calendar import.

## Decisions

### D1. An optional `noPage` flag

The event schema gains `noPage: z.boolean().optional()`, and `CalendarEvent`
gains `noPage: boolean`. Absent means false, so existing files are unchanged.
The flag is the only thing that makes an event a marker. It is not inferred
from a missing body or venue.

Alternative considered: a separate `marker` content type. It would duplicate
dates, repeats and listings, all of which a marker shares with events.

### D2. No page: one check in the repository

`getEvent(slug)` returns `null` for a marker. The event page then calls
`notFound()` and `generateMetadata` returns nothing, with no change to the page.
`sitemap.ts` filters out `noPage` events.

`getAllEvents()` keeps returning markers, because listings need them. Structured
data is only emitted on the event page, so markers publish none without further
work.

### D3. Presentation: branch in the three listing components

- **`EventCard`:** for a marker, render a non-link `<article>`:
  - the whole image, fitted (`object-contain`) inside the same height as an
    ordinary card's image (`h-44`), on the alternate surface colour. A tall
    image at its natural height stretched every card in its grid row, which
    changed the ordinary events beside it.
  - a date badge with `formatDate` only
  - the title

  The image's alt text is the title. The title also appears as text, so the alt
  repeats it. That's acceptable for a picture that is the whole content.
- **`EventRow`:** a plain `<div>` instead of the link, with `formatDate`.
- **`event-table.tsx`:** the title cell is plain text, and the time cell shows
  "—", the existing empty marker.

All three read `event.noPage`. No other component needs to know about markers.

### D4. Dates at the start of the day

When `noPage` is on, the actions store `start`, and every further date, at
00:00 site time of the date entered, whatever time was typed. A marker's `end` is a hidden field: it is stored as
posted (so it survives unchecking, per the spec) but is neither checked against
the moved start nor shown.

This puts a marker first on its day in sort order, and keeps the stored value
honest. The date logic and `occurrencesInRange` already handle 00:00. A marker
for today shows all day, because listings start at `startOfToday()`.

### D5. The form: CSS hides, a small client step switches the input

- **The checkbox:** `name="noPage"`, placed at the top, below the title.
- **Hiding fields:** the irrelevant fields get a `data-page-only` wrapper. A CSS
  rule hides them when the box is checked:
  `form:has(input[name=noPage]:checked) [data-page-only] { display: none }`.
  This works without JavaScript. Hidden inputs still post, so their values are
  stored unchanged. That is what makes unchecking reversible.
- **Switching the date input:** the start input (`EventStartInput`) and the
  further-date rows (`DateListField`) are client inputs that follow the
  checkbox (`useMarkerMode`) and render `type="date"` while it is checked. Each
  converts its value, `YYYY-MM-DDTHH:mm` to and from `YYYY-MM-DD`, so the day
  survives switching. Changing `type` from outside doesn't work: React
  re-applies the `type` prop on every input event, so the field flipped back
  as soon as the editor typed in it. Without JavaScript the inputs stay
  `datetime-local`, and D4 ignores the time.
- **The image:** the server checks the image: a picked or uploaded image, or
  an existing `featuredImage` on edit. A marker without one is redirected back
  with `error=image-required`, a new message in `FORM_ERRORS`.

Alternative considered: a client component for the whole form. Rejected as far
more change than the problem needs. The form already relies on the server for
validation.

## Risks / Trade-offs

- [Rollback to code without `noPage`] → old code strips the flag. Markers then
  become ordinary events with a page and a 00:00 time until the release is
  deployed again. No event disappears.
- [A tall portrait image shows small] → the image is fitted to the card's
  image height to keep the grid even, so a portrait picture shows narrow, with
  space on either side. Landscape images suit markers best.
- [`:has()` in old browsers] → only the backend uses it, and it's supported in
  all current browsers. In an unsupported one, the fields simply stay visible,
  and D4 and D1 still apply.

## Migration Plan

None. Existing events have no `noPage` and behave as before.
