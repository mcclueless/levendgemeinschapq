## Context

An event page already emits Open Graph tags. `src/app/agenda/[slug]/page.tsx`
calls `pageMetadata` from `src/lib/metadata.ts` with the event's title, its
`excerpt` as the description, and its `featuredImage`. The root layout sets
`metadataBase` from `site.url`, so relative paths resolve to absolute URLs
already. Pages are statically generated with `revalidate = 600`, so a link-preview
crawler — which executes no JavaScript — sees fully rendered tags.

What is missing is not the plumbing but the content: the description carries no
date, no time and no recurrence, and the title carries no venue.

Three constraints shape the design.

**A link preview has three slots.** Image, title, description, plus an automatic
domain label. There is no layout to control and no field to add, so every fact the
card must convey has to be packed into the title or the description.

**Descriptions truncate.** WhatsApp shows roughly two lines and cuts the tail, with
the exact point varying by device and font size. Ordering is therefore a design
decision, not cosmetics: whatever is placed last is what disappears.

**Previews are cached per URL with no purge.** A card already shared keeps its old
form indefinitely, and iterating on the format requires a URL no client has cached.

Two pieces of existing behaviour also bear on this. The event page displays
`nextOccurrence(...)` — the rolled-forward date for a recurring event — rather than
the stored start. And `getEvent` returns an event whose `venue` is already hydrated
to an object carrying `name` and `href`, so the venue name is available inside
`generateMetadata` with no additional fetch.

## Goals / Non-Goals

**Goals:**

- An event URL pasted into WhatsApp shows what the event is, where it is, when it
  is next on, and whether it repeats — without the reader opening the link.
- The date on the card is the same date the page shows when the reader taps it.
- One recurrence vocabulary across the share card, the public event page, and the
  review queue, correct for every interval.

**Non-Goals:**

- Generating a composed share image. Ruled out deliberately; the featured image is
  used as uploaded.
- Resizing, re-encoding or weight-checking uploaded images. A preview image that is
  too heavy for a client to display is an editorial matter, not a system guarantee.
- Share descriptions for projects, venues, organisers or blog posts. The helper
  changes are shared, so extending later is cheap, but no behaviour changes for
  them here.
- Any change to stored content or the content schema.

## Decisions

### D1: Date first, excerpt last

Compose the description as `date · time · recurrence — excerpt`.

Because truncation eats the tail, the ordering determines what a reader is
guaranteed to see. Date, time and recurrence are short, bounded, and are precisely
the facts that decide whether someone is interested; the excerpt is long,
unbounded and the most expendable. Leading with the excerpt — the arrangement
closest to today's behaviour — puts the date in exactly the position most likely to
be cut, which would defeat the purpose of the change.

*Alternative considered:* excerpt first, date appended. Rejected: it reads more
naturally as prose but loses the date on narrow screens, which is the specific
failure this change exists to fix.

### D2: Venue in the title, not the description

Render the title as `<event title> · <venue name>`.

The description's visible budget is roughly two lines and is already carrying three
facts plus prose. The title is shown in full and is far less likely to be
truncated, so the venue costs nothing there. "Where" is high-value for a
neighbourhood audience deciding whether an event is within walking distance.

When an event has no venue the title is the event title alone, with no trailing
separator. The venue name comes from the already-hydrated `event.venue.name`.

*Alternative considered:* venue as a fourth element in the description. Rejected:
it competes with the date for the space that truncation threatens.

### D3: The card's date is the displayed occurrence

Compute the date with `nextOccurrence(event.start, event.recurrence, startOfToday())`,
falling back to `event.start`, which is exactly what the page body does.

Using the stored start would make a recurring event's card advertise a historical
date while the page it opens shows an upcoming one. That contradiction is worse
than no date at all, because it makes the site look wrong at the moment a new
visitor first meets it. The recently merged calendar-import work rolls a recurring
entry's stored start forward on import, which narrows this gap but does not close
it: an event authored by hand can still hold a past start with a live recurrence.

### D4: One recurrence-label module, honouring `interval`

Add `src/lib/recurrence-label.ts` exporting two functions over the existing
`Recurrence` type:

- `recurrenceLabel(r)` → the short interval phrase, or `undefined` when the event
  does not repeat: `Elke week`, `Elke 2 weken`, `Elke maand`, `Elke 2 maanden`.
- `recurrenceDetail(r)` → the fuller admin phrasing built on the same base:
  `Eenmalig` when absent, otherwise the short phrase followed by `, t/m <date>` or
  `— zonder einddatum`.

Three call sites converge on this module: the new share description, the badge at
`src/app/agenda/[slug]/page.tsx:81`, and `recurrenceLabel` at
`src/app/beheer/queue/page.tsx:52`.

This corrects a live defect. The schema carries
`interval: z.number().int().positive().default(1)`, but neither existing label
reads it, so an event repeating every two weeks is described as "Elke week" to
visitors and "Wekelijks" to editors. Both are wrong, and adding a third
independently written label would compound the problem.

Unifying on the `Elke X` register means the review queue's wording changes from
"Wekelijks" to "Elke week". This is an intentional trade: one vocabulary product-wide
beats preserving an admin-only phrasing, and mixing registers reads badly once
intervals appear ("Wekelijks" has no natural two-week form).

*Alternative considered:* keep two registers and share only the interval
arithmetic. Rejected as more surface for less benefit.

### D5: Image dimensions on the shared helper

Extend `pageMetadata` to emit `og:image:width` and `og:image:height` alongside the
image URL. Clients use these to decide between a large card and a small side
thumbnail; without them the choice is left to the client's own guess.

Placing this on the shared helper rather than the event page means every content
type gains it, which is consistent and costs nothing extra.

Because uploads are not processed, real dimensions are not known at build time.
The declared values therefore describe the intended presentation ratio rather than
measuring the file. This is a hint, not a contract, and a mismatch degrades to the
client's own layout choice rather than breaking the card.

### D6: Degrade by omission

Each element is dropped cleanly when its source is absent, and separators are
joined rather than templated, so a missing value never leaves a stray `·` or a
dangling dash. `excerpt` is optional in the schema; when it is absent the
description is the date line alone, which reads correctly. When an event does not
repeat, the recurrence segment is simply absent.

This matches the accepted position that a missing featured image is an editorial
problem: the system stays correct and quiet rather than inventing substitutes.

## Risks / Trade-offs

**Preview caches are permanent and un-purgeable** → Cards shared before this ships
keep their old form, and verification needs a URL no client has seen. Test against
freshly created events, or a cache-busting query string, and treat "the old card is
still showing" as expected rather than a bug.

**Declared image dimensions are a stated intent, not a measurement** → A file whose
real ratio differs may render differently than declared. The failure mode is a
client choosing its own layout, not a broken card. Accepted under D5.

**A heavy featured image still yields an imageless card, silently** → Uploads are
accepted to 10 MB and previews are commonly dropped above a few hundred kilobytes,
with no error surfaced anywhere. Out of scope by decision, but it is the most
likely reason a card underperforms in practice, so it is worth documenting for
editors rather than leaving as folklore.

**Admin wording changes** → Editors see "Elke week" where the queue said
"Wekelijks". Cosmetic, intentional under D4, and worth mentioning to them rather
than letting it read as a regression.

**Truncation points are not specified by any client** → The two-line figure is
observed, not guaranteed, and varies by device. D1's ordering is what makes this
safe: correctness does not depend on knowing the exact cut point, only on putting
the important facts before it.

## Open Questions

- Should `twitter:card` be set to `summary_large_image`? It is a small addition on
  the same helper and would improve previews elsewhere, but it is outside the
  stated WhatsApp goal and is left out unless wanted.
- `nl-NL` short-date formatting yields a lowercase weekday ("za 5 sep"). Capitalising
  the first letter reads better at the head of a card; confirm before implementing,
  as it is a visible wording choice rather than a technical one.
