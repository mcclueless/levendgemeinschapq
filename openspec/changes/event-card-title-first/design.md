## Context

`event-card.tsx` holds the image variant: `EventCard` (image, `WhenBadge`,
title with the external mark, venue) and `MarkerCard` (uncropped image, date
badge, title). The badge is `Badge tone="accent"`, the yellow box; for a
collapsed recurring event it stacks a rhythm line over the next date. The
text-only `EventRow` and the table are separate and unchanged.

The file was last changed by `event-recurring-next-only` and
`event-external-link`, both committed to main and deployed, with their live
test still open. The user asked on 14 October 2026 to apply this change
regardless, so it builds on that deployed code.

## Goals / Non-Goals

**Goals:** title first, venue second, date box last, in both card kinds;
nothing else about the card moves.

**Non-Goals:** the event page; the row and table variants; the badge's
contents.

## Decisions

### D1. Reorder the JSX, move the spacing with it

In `EventCard`'s body: `h3` (no top margin), venue `p` (`mt-1`), then
`WhenBadge` with `mt-3`. In `MarkerCard`: `h3`, then the badge with `mt-3`.
The badge is an inline-flex span, so it gets a wrapping `div` or `block`
class to take the margin. `group-hover` on the title, the external mark and
the `<time>` markup are untouched.

*Alternative:* CSS `order` with the markup unchanged. Rejected: the reading
order for screen readers should match the visual order, and the markup is
three siblings.

### D2. Markers follow

A mixed grid, with the yellow box at the top of some cards and the bottom of
others, would look like a mistake. The marker scenario in the events spec is
reworded accordingly. The proposal offered the alternative (markers unchanged)
and the user chose to apply the proposal as written.

### D3. A small diff on a recently changed file

Only the two JSX blocks change, so if the open live tests of the previous
changes call for rework there, this change is easy to rebase or revert on
its own.

## Risks / Trade-offs

- [Card heights shift in the grid] → every card has the same elements in the
  same order, so rows stay aligned as before.
- [The rhythm badge is taller] → it was already; at the bottom it no longer
  pushes the title down, which is a small gain.
