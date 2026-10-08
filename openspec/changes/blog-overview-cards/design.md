## Context

`src/app/blog/page.tsx` renders `posts` in a single-column grid; each `Card`
holds `<CoverImage className="h-56">` above a text block. `CoverImage` crops
with `object-cover` and renders nothing when a post has no cover, so such a
post's card is text only; that stays as it is. A full-width
card with a fixed height gives a ratio that grows with the screen: 1.5 on a
phone, 4.85 at 1280 px.

## Goals / Non-Goals

**Goals:** covers whole at every width; a readable list on desktop.
**Non-Goals:** the post page, the homepage, pagination.

## Decisions

### D1. Horizontal card from `md`, 16:9 cover

From `md` up the card is a two-column grid: the cover in the left column at
about two fifths of the card width, `aspect-video`, the text in the right column,
vertically centred. Below `md` it stacks, cover first, also `aspect-video`.
`CoverImage` keeps `object-cover`, which at 16:9 crops nothing from a 16:9 file.

*Alternative: a multi-column card grid like projects.* Rejected for a blog:
excerpts read better at full line length, and one post per row keeps the
reverse-chronological order obvious.

*Alternative: full-width cover at 16:9.* Rejected: about 610 px tall per post at
desktop width pushes the text below the fold for every post.

### D2. Card stays one link target as today

Only the title and "Lees verder" link, as now. No change to semantics.

## Risks / Trade-offs

- **[Short excerpts leave white space beside a tall image]** At two fifths of
  ~1086 px the cover is ~434 × 244; a post with a one-line excerpt sits in a
  244 px row. → Acceptable; centring the text keeps it balanced.

## Migration Plan

None. Deploy and look at /blog at phone and desktop width.
