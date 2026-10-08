## Why

Organisations already publish their events on their own sites. Today, putting
one in the Goeddoen agenda means copying its whole text into an event page,
which is extra work for the organisation and an extra step for visitors who
then click through to the organisation anyway. Atticus asked on 8 October 2026
for organisations to have a choice: put the full event in Goeddoen, or enter
only an image, title and date and let the agenda link straight to their own
page. He expects this, with user accounts, to make the events workload
manageable.

## What Changes

- An event can **lead to an external page** instead of its own page on
  Goeddoen. Its agenda entry links straight to that page.
- **No Goeddoen page** for such an event: its address returns "not found", it
  is left out of the sitemap, and it publishes no structured data, as agenda
  markers already do.
- Its listings look like an **ordinary event** — image, date and time,
  location and organiser when given — with a visible "↗" mark and a
  screen-reader text naming the external site, so leaving Goeddoen is never a
  surprise. The link opens in the same tab.
- The admin event form replaces the "Geen pagina" checkbox with **one choice
  between three modes**: its own page (the default), an external page with its
  address, or no page at all. An external event requires an http or https
  address and an image.
- Existing events and markers are unchanged.

Not in scope: a goeddoen.net address that forwards to the external page;
taking the address from calendar imports; the public submission form; link
checking.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `events`: new requirement **Events that lead to an external page**.
- `editorial-backend`: new requirement **Choosing where an event leads**.

## Impact

- `src/content/schema.ts`, `types.ts`, `repository.ts`, `summaries.ts`: an
  optional external address on an event.
- `src/content/event-dates.ts` (`occurrenceLink`) and the three listing
  components: the external link and its mark.
- `src/app/sitemap.ts`: leaves external events out.
- The admin event create and edit forms and their action.
- No migration: the field is optional and absent from every stored event.
