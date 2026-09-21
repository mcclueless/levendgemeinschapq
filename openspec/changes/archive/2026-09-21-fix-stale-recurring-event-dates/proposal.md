## Why

A recurring event's page advertises a date that drifts into the past.

`/agenda/[slug]` computes the occurrence to display with
`nextOccurrence(event.start, event.recurrence, startOfToday())` — a value relative
to the day it renders. The route is statically generated via
`generateStaticParams` with `revalidate = 600`, so that "today" is frozen at build
time. Observed on the deployed site:

| Date | Repair Café page showed | Correct |
|---|---|---|
| 31 Aug, just after a deploy | Wo 2 sep | Wo 2 sep |
| 3 Sep, before any deploy | Wo 2 sep | Wo 9 sep |
| 3 Sep, after a deploy | Wo 9 sep | Wo 9 sep |

Three days elapsed with a ten-minute revalidation window and the page never
refreshed. Only a rebuild corrected it. Whatever the cause — revalidation not
firing on Amplify's compute platform, or a cache that outlives it — the effect is
that a page's date is only as fresh as the last deployment, on a site that may go
weeks without one.

This matters more than ordinary staleness. The date is not merely old, it is
wrong: it names an occurrence that has already happened, on the page a neighbour
opens to decide whether to attend. It also reaches further than the page. The date
is baked into `og:description`, so every share card carries it too — and the
share-preview work deliberately sourced its date from the same expression as the
page body precisely so the two could never disagree. They still agree; they are
now both wrong together.

It also puts the detail page at odds with the listings. `/agenda` is
`force-dynamic`, so it renders fresh and shows the correct upcoming occurrence,
while the page it links to may show a past one.

## What Changes

- Make an event's displayed occurrence correct on the day it is read, rather than
  on the day it was built, so that a page, its share card, and the listing that
  links to it never disagree with the calendar.
- Establish the same guarantee for any other page whose content is computed
  relative to the current day.

Not in scope: changing recurrence expansion, share-preview composition, or the
listing pages, all of which are correct — this is about when the correct value is
computed, not what it is.

## Capabilities

### Modified Capabilities

- `events`: the **Single event view** requirement describes what an event page
  shows but not when it is determined. It gains the guarantee that an occurrence
  presented to a reader reflects the day of reading, which is the property that is
  currently violated.

## Impact

**Affected code**

- `src/app/agenda/[slug]/page.tsx` — the only route that renders a value derived
  from `startOfToday()`, in both `generateMetadata` and the page body.

**Possibly affected**

- The other statically generated content routes — `blog/[slug]`,
  `locaties/[slug]`, `organisatoren/[slug]`, `projecten/[slug]` — share the
  `generateStaticParams` + `revalidate = 600` shape. None renders a date relative
  to today, so none is wrong in the same way, but if revalidation is genuinely not
  firing then they are serving content from the last deploy rather than from within
  ten minutes, which is not what the code says.

**Constraints to respect**

- The date must be present in server-rendered HTML. Share-preview crawlers execute
  no JavaScript, so computing the occurrence on the client would fix the visible
  page and leave every share card wrong.
- `lighthouserc.json` gates performance at 0.9 and LCP at 2500 ms as warnings, and
  accessibility and SEO at 0.95 as errors. A fix that renders per request must not
  regress them.

**Unknown, to be settled by investigation**

- Whether Next's ISR revalidation works at all on this Amplify `WEB_COMPUTE`
  deployment. That answer decides whether the fix is a route-level change, a
  scheduled rebuild, or a platform configuration — and it is worth knowing before
  choosing, because the same uncertainty affects every other cached route.
