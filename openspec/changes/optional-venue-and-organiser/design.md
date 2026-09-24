## Context

The requirement is enforced three times over, and all three have to agree:

```
 schema.ts     venue: z.string().min(1)          ← a document without it fails to parse
    ▲          organiser: z.string().min(1)
 actions.ts    if (!venue || !organiser) redirect(?error=1)
    ▲
 form page     <Select required>                  ← the browser blocks the submit
```

The display layer, by contrast, was written for absence already: the event page's
location and organiser block is conditional, the card, row and table cells are
conditional, `shareTitle` has a test for a missing venue, and `eventJsonLd` omits
`location` and `organizer`. The repository resolves an unknown reference to
`null`, which the projects spec calls out as "Unknown references degrade
gracefully".

So this change is mostly removals, in the three layers above.

## Goals / Non-Goals

**Goals:**
- Save an event with no Venue and no Organiser, and a project with no Venue, from
  the backend.
- Clear a reference that was set.
- Tell "has none" apart from "names something that no longer exists".

**Non-Goals:**
- The public submission form, which keeps both.
- Calendar feeds, which keep their required defaults.
- Blog posts and organisers, already optional.
- Making a project's organisers optional.

## Decisions

### D1. Optional in the schema, absent rather than empty in storage

`venue` and `organiser` become `z.string().min(1).optional()` on events, and
`venue` on projects. The `min(1)` stays inside the optional, so `venue: ""` is
still invalid: a field is either a real slug or not there at all. `serialize()`
in `write.ts` already drops `undefined` and `""`, so an unselected value never
reaches the document.

*Why loosening is safe:* `parseAll` skips documents that fail validation, so
tightening a field can silently remove content from the site (the reason
`feedId` and `socials` are optional). Loosening cannot: every stored event and
project keeps parsing exactly as before.

### D2. The empty option carries a label, and is not `disabled`

The create forms already open on a `disabled` placeholder ("Kies een locatie…"),
so nothing silently defaults to the first venue. That placeholder becomes a real,
selectable option:

```
 before                         after
 ┌────────────────────────┐     ┌────────────────────────┐
 │ Kies een locatie…  ✖   │     │ Geen locatie       ✔   │  ← selectable, and the
 │ De Brink               │     │ De Brink               │     default for new items
 │ Werkplaats Noord       │     │ Werkplaats Noord       │
 └────────────────────────┘     └────────────────────────┘
```

On the edit form the same option lets an editor clear a reference — that is what
makes "not required" different from "starts empty".

The organiser form's existing location selector already does exactly this ("Geen
locatie"), so this is applying a pattern the backend already has rather than
inventing one.

### D3. `types.ts` keeps `venue: Venue | null`

The resolved model already says `Venue | null`, because an unresolvable
reference resolves to `null`. Absence and unresolvable therefore look the same
to every public surface — which is right, since both mean "nothing to show".

The distinction only matters to a reviewer, so it lives where reviewers look:
the queue (D4).

### D4. The queue distinguishes absent from unresolved

`getPendingSubmissions` labels a reference with `label()`, which returns
`"<slug> (onbekend)"` when the slug does not resolve. With the field absent there
is no slug to print, so it would read " (onbekend)" — as though the data were
broken.

The queue's `venueSlug`/`venueName` become optional, and the panel says "Geen
locatie" for absence, keeping "(onbekend)" for a slug that no longer resolves.

### D5. The public submission form keeps both

It is the one path where the person filling the form is not the person publishing
it. A missing venue there is a question an editor has to chase, not a decision
they made. Its action keeps its `if (!venue || !organiser)` guard, so a
hand-crafted POST cannot store a submission without them either.

## Risks / Trade-offs

- **[Events with no location lose their event rich result]** Schema.org requires
  `location` on an `Event`, so Google will not show a rich result for one without
  it. → Accepted: the alternative today is inventing an address, which is worse
  than no rich result. The page, the listings and the share card are unaffected.
- **[Fewer references protect Venues and Organisers]** The hide/delete guards
  count referring content; events without a venue no longer count towards it, so
  a Venue may become deletable where it was not. → Correct behaviour, but worth
  knowing: deletion is irreversible and its guard is the only thing standing in
  front of it.
- **[Editors skipping the field out of convenience]** "Geen locatie" as the
  default for new items makes it easy to leave empty. → Accepted; the agenda
  shows the gap plainly, and an editor can fill it in later.

## Migration Plan

No data migration: the change only loosens what is accepted. Every existing event
and project keeps its references and renders identically. Deploy, then save one
event with neither and check the page, the agenda and the queue.

Rollback is a revert — but an event saved with no Venue would then fail
validation and disappear from the site and the backend until it is given one.
Anything created in the window between deploy and rollback needs a Venue and an
Organiser before reverting.
