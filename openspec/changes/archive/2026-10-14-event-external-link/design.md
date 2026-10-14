## Context

`event-no-page` added agenda markers: an optional `noPage` flag, read in three
places. `getEvent(slug)` returns `null` for a marker, so its page is "not
found". `sitemap.ts` filters markers out. `EventCard`, `EventRow` and the table
render a marker without a link or time. The form has a "Geen pagina" checkbox
(`NoPageField`); CSS in `globals.css`
(`form:has(input[name="noPage"]:checked) [data-page-only]`) hides the fields a
marker never shows, so hiding works without scripts. `readMarker` in
`actions.ts` reads the box and drops times.

Every listing builds an event's link with `occurrenceLink(event, start)` in
`event-dates.ts`: the agenda, homepage, venue, organiser and project lists.

Social links already have an http/https-only URL rule (`webUrl` in
`schema.ts`), because an unchecked URL in an `href` can run script.

## Goals / Non-Goals

**Goals:** an event that is only a pointer to an organisation's own page, cheap
to enter, honest about leaving the site; existing events and markers untouched.

**Non-Goals:** a forwarding address on goeddoen.net; calendar-import URLs; the
public submission form; checking that the link works.

## Decisions

### D1. One optional `externalUrl` field; the mode is derived

The stored event gains `externalUrl?: string`, validated with the same
http/https rule as social links. The mode is derived, not stored:

| Stored | Mode |
|---|---|
| `noPage: true` | marker |
| `externalUrl` set | external |
| neither | own page |

Every existing file has neither, so it keeps its mode with no migration.

*Why not one `mode` field:* it would make every existing document change shape
or need a default, and `parseAll` skips a document that fails validation, the
constraint behind `noPage` being optional too.

If a hand-edited file carries both, it is treated as a **marker**, the more
restrictive mode, so no unintended outbound link appears. The form never writes
both (D4).

*Why the schema enforces http/https, unlike most form-only rules:* the value goes
straight into an `href`. No stored event has the field yet, so tightening it
removes nothing, the same reasoning as for social links.

### D2. No page: the existing marker check, widened

`getEvent(slug)` returns `null` when the event is a marker **or** external, so
its page and metadata are "not found" with no change to the page. `sitemap.ts`
filters on the same derived "has a page". A small `hasOwnPage(event)` helper
holds the rule, so the two cannot disagree.

### D3. The link: one helper, and a mark in each listing

`occurrenceLink(event, start)` returns `event.externalUrl` for an external
event, so every listing links out with no per-page change. The listing
components render an external event as an ordinary one — image, date and time,
title, venue — plus:

- a "↗" after the title, `aria-hidden`;
- visually hidden text "(opent website van <host>)", where `<host>` is the
  address's hostname without `www.`, so screen readers announce where the link
  goes;
- `target="_blank"` with `rel="noopener noreferrer"`: a new tab, as the
  requester specified, so the agenda stays open in its own tab.

A plain `<a>` is used instead of Next's `Link`, which is for routes on the site.

### D4. The form: one radio group replaces the checkbox

`NoPageField` becomes `EventModeField`: a fieldset "Waar leidt dit evenement
naartoe?" with three radios named `mode` (`page`, `external`, `marker`), and an
address input shown for `external`. Hiding stays CSS-only, keyed on the checked
radio:

- `marker`: hides `[data-page-only]` as today;
- `external`: hides the same fields except the ones an external card shows
  (venue, organisers, end, and further dates stay; body text, short
  description and social links hide), marked with a new `[data-page-text]`;
- the address input shows only for `external`.

The action reads `mode`. `marker` sets `noPage: true` and clears
`externalUrl`. `external` requires an image and a valid address, then sets
`externalUrl` and clears `noPage`. `page` clears both. Other fields are never
cleared, so switching back restores them, as markers already do.

The edit form preselects the mode derived in D1. The marker date handling
(`readMarker`) runs only for `marker`.

### D5. Errors

Two new form errors: `external-url` ("Vul een volledig webadres in, beginnend
met https://.") and the existing `image-required` reused for external events.

## Risks / Trade-offs

- **[Sharing on WhatsApp]** There is no goeddoen.net link to share for an
  external event; people share the organisation's link. Chosen deliberately over
  a forwarding address.
- **[Link rot]** An organisation may move or remove its page. → Not checked;
  editors see the address on the edit form. A link checker is a possible
  follow-up.
- **[Leaving the site]** Visitors may not expect to land elsewhere. → The
  visible mark and the screen-reader text.

## Migration Plan

None. Deploy, create one external test event, check it in the agenda, on its
organiser's page, and that its goeddoen.net address is "not found"; then
delete it.
