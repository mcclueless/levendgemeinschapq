## Why

The organisers overview page shows each organiser as a card with its cover image, which is the first photo of its slideshow. An organisation is recognised by its logo, not by a photo of an activity, so the overview reads better as a row of logos. The logo field exists since organiser-page-layout but is shown only on the organiser's own page.

## What Changes

- **Logo first on organiser cards.** On the `/organisatoren` overview and in the homepage's "Wie we zijn" grid, each card SHALL show the organiser's logo when it has one. The logo is shown whole on a plain white panel that fills the card's 16:9 image area, never cropped to fill the box, since wordmarks and emblems do not survive a crop. A logo exported at 16:9, as the team's image rule asks, fills the area edge to edge (revised 2026-10-08).
- **A fallback chain when there is no logo.** Without a logo the card shows the organiser's cover image as it does today. Without a cover either, the card shows the organiser's name on a brand-coloured panel, as the homepage's who-we-are cards already do. No card is ever left without an image area, and the same organiser looks the same on both pages.
- **The organiser's own page is unchanged.** It keeps the logo beside the name and the photo slideshow.
- **Amends the cover rule.** The organisers spec currently says the first image serves as the cover "wherever a single image represents it", with a scenario for lists and share previews. That rule stays for share previews and for any list without a logo, and gains the exception that a listing card prefers the logo.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organisers`: the "Organiser image slideshow" requirement's cover rule gains the listing-card exception; a new requirement describes the organiser card's image chain (logo, cover, name panel) and the uncropped presentation of a logo, wherever organisers are listed as cards.
- `homepage`: the "who we are" section's cards are no longer described as cover-image cards; they follow the organiser card's image chain.

## Impact

- `src/app/organisatoren/page.tsx` and `src/components/home/who-we-are.tsx`: both cards pick logo, then cover, then the name panel, and render a logo contained rather than covered.
- One shared card-image component holds the three branches, so the overview and the homepage cannot drift apart.
- No data or schema changes: `logo` and `featuredImage` already exist on the organiser record.
- The gallery's in-use check already counts a logo, so nothing changes for deletion safety.
- Share previews and structured data keep using the cover image.
