## Why

An event cannot be saved in the backend without a Venue and an Organiser, and a
project cannot be saved without a Venue. Plenty of real entries have neither: a
neighbourhood walk with no fixed address, an activity whose host is not one of
the organisations on the site, an initiative that covers the whole area. Today an
editor has to invent a location to get past the form, which puts a wrong address
on the public page.

Nothing downstream needs the fields. Every public surface already renders without
them — the event page's location block, the cards, the table, the share card and
the structured data are all conditional, and the resolver turns an unknown
reference into nothing rather than a broken link.

## What Changes

- In the **backend**, an event's Venue and Organiser, and a project's Venue,
  become optional. Each selector offers "Geen locatie" / "Geen organisator" as a
  real choice, and an editor can clear one that was set.
- A **project still needs at least one organiser**: "door wie?" is close to what
  a project is.
- The **public submission form is unchanged** — a visitor still gives a Venue and
  an Organiser. Those are the hardest facts for an editor to reconstruct later,
  and a submission is a request to publish someone else's event.
- The **approval queue** says "Geen locatie" for an absent reference, instead of
  the "(onbekend)" it uses for one that no longer resolves. The two mean
  different things to a reviewer.

Not in scope: calendar feeds, which keep requiring a default Venue and Organiser
(so an unmatched import still lands on the feed's default and is flagged); the
public submission form; and blog posts and organisers, whose references are
already optional.

## Capabilities

### Modified Capabilities

- `events`:
  - **Event entity and fields** — the Venue and Organiser become optional.
  - **Venue and Organiser selection from drop-down lists** — the selectors offer
    an explicit "no location" / "no organiser" choice, still with no free text.
- `projects`:
  - **Project content type** — the location becomes optional; at least one
    organiser is still required.
  - **Project detail page** — the location block appears only when there is one.
- `editorial-backend`:
  - **Relationship selectors on the event form** — the selectors are no longer
    required and offer the empty choice.
  - **Relationship selectors on the project form** — the location is no longer
    required; the organiser rule is unchanged.

## Impact

- `src/content/schema.ts` — `venue` and `organiser` optional on events, `venue`
  optional on projects. Loosening only: every stored document stays valid.
- `src/app/beheer/actions.ts` — create and edit for events and projects stop
  rejecting an empty selection and store nothing rather than an empty string.
- `src/app/beheer/nieuw/{evenement,project}` and the edit form — the empty option,
  and no `required`.
- `src/content/admin.ts` — the queue's label for an absent reference.
- `src/content/types.ts` / repository — an event's `venue` and `organiser` are
  already resolved to `null` when unknown; the types follow the schema.
- No migration. No public page changes: every surface is already conditional.
