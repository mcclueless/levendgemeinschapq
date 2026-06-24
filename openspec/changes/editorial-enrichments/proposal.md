## Why

Day-to-day editing has four rough edges. The cover-image field shows a raw, unstyled browser "Choose file" control that clashes with the polished "Kies uit galerij" button beside it. Uploaded images can only ever be *picked* (read-only, from inside a cover field) — there is no way to browse the whole image bank, upload ahead of time, or remove images that are no longer needed. Organisers can list a website and phone but cannot point to the Location they operate from. And neither Organisers nor Events can surface their social media presence. This change smooths all four.

## What Changes

- **Restyle the cover-image upload control** so the file picker matches the "Kies uit galerij" button. This is one shared component (`ImageField`), so the fix applies to Events, Venues, Organisers, and Blog posts at once.
- **Add a standalone media library** at `/beheer/galerij` where the administrator can browse every uploaded image, upload new ones, and delete images. Deletion is **reference-safe**: an image still used as a cover or in a venue gallery cannot be deleted, and the library names what uses it. The library is reachable from the backend navigation and from the admin-presence banner.
- **Let an Organiser link to a Location.** Add an optional venue selector on the Organiser form; the Organiser's public contact block shows a "Locatie" row that links to that venue's page.
- **Add social media links to Organisers and Events** for a curated set of platforms (Instagram, Facebook, X/Twitter, LinkedIn, YouTube), rendered as a small icon row. These are plain profile links — no embedded feeds, no third-party scripts, no consent gating.

## Capabilities

### New Capabilities
- `media-library`: A standalone backend surface to browse the image bank, upload new images, and delete images with reference-safe guarding (an image in use cannot be deleted, and the references are named).

### Modified Capabilities
- `editorial-backend`: The cover-image field control is restyled; the Organiser form gains a Location selector; the Event and Organiser forms gain curated social-link inputs; the backend exposes the media library.
- `organisers`: The Organiser page shows a linked Location (when set) in the contact block and a row of social media links.
- `events`: The Event page shows a row of social media links.
- `design-system`: Adds a styled file-input control (a button that drives a visually-hidden native input, showing the chosen filename) and a small set of inline-SVG social media icons.

## Impact

- **Schema** (`src/content/schema.ts`): `OrganiserFrontmatter` gains `location?` (a venue slug) and a `socials` object; `EventFrontmatter` gains the same `socials` object. All optional and backward-compatible.
- **Media** (`src/content/media.ts`): add `deleteMedia(key)` for both S3 (`DeleteObjectCommand`) and the local `public/uploads` fallback.
- **Reference safety** (`src/content/admin.ts`): add an image-reference scan that checks `featuredImage` across all four content types and venue `images[]` for a given image URL.
- **Backend**: new `/beheer/galerij` page and its server actions (upload, delete); `AdminShell` nav and the admin-presence banner gain a "Galerij" link; the Organiser create/edit forms gain a venue dropdown (reusing the Event form pattern) and social inputs; the Event forms gain social inputs.
- **Components**: `ImageField` restyle; `ContactInfo` gains a Location row; a new shared `SocialLinks` component with inline-SVG icons.
- **Out of scope**: embedded/live social feeds; extending the hide-guard to organiser→venue references (a hidden venue can leave an organiser's link dangling); any multi-user concerns.
