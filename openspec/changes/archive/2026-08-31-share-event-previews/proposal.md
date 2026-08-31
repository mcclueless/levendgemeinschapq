## Why

Most day-to-day communication in the neighbourhood happens in WhatsApp groups, so
sharing an event link there is the main way a neighbour first meets the site. Today
an event URL pasted into WhatsApp produces a thin card: the title alone, and a
description that is the raw excerpt with no date, no time, and no indication that
the event repeats. A neighbour has to open the link to learn the one thing that
decides whether they are interested — when it is on. A card that answers "what,
where, when" at a glance turns a pasted link into an invitation, and gives people a
reason to tap through to the site.

## What Changes

- Compose an event's social description as `date · time · recurrence — excerpt`,
  in that order. Link previews truncate after roughly two lines, so the facts that
  matter most are placed where truncation cannot reach them; the excerpt is what
  degrades.
- Include the event's venue in the social title, so the card answers "where"
  without spending the description's scarce characters.
- Derive the shared date from the same next-occurrence value the event page itself
  displays, so a card never advertises a date that differs from the page it opens.
- Emit `og:image` dimensions, which is what tells a link preview to render a large
  card rather than a small side thumbnail.
- Extract one shared recurrence-label helper that honours the recurrence
  `interval`, and use it for the share description, the public event page, and the
  review queue.

Not in scope: generating a composed share image, resizing or re-encoding uploaded
images, and extending share descriptions to projects, venues, organisers, or blog
posts. Keeping an uploaded featured image small enough for a link preview to
display remains an editorial responsibility, not a system guarantee.

## Capabilities

### New Capabilities

None. Social-sharing metadata already belongs to `seo-discoverability`, and
recurrence presentation already belongs to `events`; introducing a third spec
would split behaviour that these two already own.

### Modified Capabilities

- `seo-discoverability`: the **Per-page metadata** requirement currently asks only
  that social-sharing tags exist and be unique per page. It gains a requirement
  covering what an event's share card must actually carry — the composed
  description and its ordering, the venue-bearing title, agreement with the
  displayed occurrence, and image dimensions.
- `events`: the **Repeatable (recurring) events** requirement gains a statement
  that a recurrence is described to readers in terms that reflect its interval.
  This is a spec-level correction, not only an implementation detail: an event
  that repeats every two weeks is currently described to visitors as repeating
  every week.

## Impact

**Affected code**

- `src/app/agenda/[slug]/page.tsx` — `generateMetadata` composes the description
  and title; the body's inline recurrence badge switches to the shared helper.
- `src/lib/metadata.ts` — `pageMetadata` carries image dimensions.
- `src/app/beheer/queue/page.tsx` — its local `recurrenceLabel` is replaced by the
  shared helper.
- A new recurrence-label module, alongside the existing `src/lib/date.ts`
  formatting helpers it will build on.

**Existing defects this corrects**

- `src/app/agenda/[slug]/page.tsx:81` and `src/app/beheer/queue/page.tsx:54` hold
  two separately written recurrence labels that disagree in wording ("Elke week"
  versus "Wekelijks") and both ignore `interval`, so every non-default interval is
  currently described incorrectly in both places.

**No impact on**

- Content schema, stored content, or the media pipeline — this change reads
  existing fields and writes no new ones.
- Calendar import, which populates `recurrence` but does not present it.

**External behaviour to be aware of**

- WhatsApp and similar clients cache a link preview per URL, with no purge
  mechanism. Cards already shared before this change will not update, and
  verifying the new format needs a URL a client has not cached yet.
