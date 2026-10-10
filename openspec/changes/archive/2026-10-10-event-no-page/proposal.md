## Why

The editor wants to mark days in the agenda that aren't events: school holidays,
the switch to summer or winter time, the first day of a season. Today the only
way is an ordinary event, which:
- gets its own page with nothing to say
- shows a time such as "00:00"
- crops its image to a thin strip in the card view

A marker should show a picture on its day in the agenda, and nothing more.

## What Changes

- The admin event form gets a **"Geen pagina"** checkbox. An event with it
  checked is an **agenda marker**:
  - **Card view:** the whole image, not cropped, then the date and the title.
    The card is not a link.
  - **Text and table views:** the date and the title, without a link.
  - **No time anywhere:** a marker is about a day. The form takes its date
    only, and listings never show a time for it.
  - **No page:** the marker's address returns "not found". It is left out of
    the sitemap and publishes no structured data.
  - **An image is required:** a marker can't be saved without one.
  - **Hidden fields:** fields that a marker never shows (text, end, venue,
    organisers, social links, short description) are hidden while the box is
    checked. Their values are kept, so unchecking the box brings them back.
- Markers can repeat weekly or monthly, or carry a list of further dates, so
  one "Begin van de lente" marker can hold several years.
- Markers appear in every upcoming-events listing that shows them by date: the
  agenda, the homepage, and listings embedded in pages and posts. They don't
  appear on venue or organiser pages, because they have neither.

Not in scope:
- an "all day" option for ordinary events
- yearly repeats
- markers on the public submission form or from calendar import

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `events`:
  - **New requirement: agenda markers without a page.** How a marker is
    presented, and that it has no page.
  - **New requirement: creating an agenda marker.** The checkbox, the date
    without a time, and the required image.

## Impact

- `src/content/schema.ts`: an optional `noPage` flag on events.
- `src/content/types.ts`, `src/content/repository.ts`: the flag on
  `CalendarEvent`. `getEvent` returns nothing for a marker.
- `src/components/events/event-card.tsx`, `event-table.tsx`: marker
  presentation.
- `src/app/sitemap.ts`: markers left out.
- The admin event create and edit forms and their actions in
  `src/app/beheer/actions.ts`.
- Unchanged: stored ordinary events, the public submission form, calendar
  import. No new dependency.
