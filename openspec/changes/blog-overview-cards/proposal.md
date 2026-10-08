## Why

The blog overview lists each post as a card spanning the full page width with a
fixed 224 px image height. At desktop width that box is about 1086 × 224, a
4.85:1 strip: a 16:9 cover loses about 63% of its height, so posters and photos
show only a band through the middle. Measured on goeddoen.net on 8 October
2026. It is the one surface the new image guidance (`image-guidance`) cannot
honestly advise around.

## What Changes

- From the medium breakpoint up, each blog card puts its cover **beside** the
  text, in a 16:9 box, instead of across the top. The whole 16:9 image shows,
  with nothing cut off.
- On phones the card keeps the cover on top, also in a 16:9 box.
- A post without a cover keeps showing no image, its text across the full card,
  as today.
- Order, content, links and what is listed are unchanged.

Not in scope: the single post page (2:1, within the image guidance's safe
area), the homepage, paging or filtering the blog.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `blog`: **Reverse-chronological blog listing** — the listing shows each
  post's cover whole, at 16:9.

## Impact

- `src/app/blog/page.tsx` only. No change to content, data or other pages.
