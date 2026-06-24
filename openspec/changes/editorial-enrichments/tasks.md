## 1. Schema

- [x] 1.1 Add optional `location` (venue slug) to `OrganiserFrontmatter` in `src/content/schema.ts`
- [x] 1.2 Add an optional `socials` object (instagram/facebook/x/linkedin/youtube, each an optional URL) to both `EventFrontmatter` and `OrganiserFrontmatter`

## 2. Cover-image field restyle (#1)

- [x] 2.1 In `ImageField` (`src/components/admin/image-field.tsx`), visually hide the native file input and add a styled "Bestand kiezen" button matching "Kies uit galerij" that triggers it
- [x] 2.2 Show the chosen filename as feedback; keep the control keyboard-operable and accessible
- [x] 2.3 Verify all four forms (event/venue/organiser/blog) inherit the new control

## 3. Media store: delete + reference scan (#2)

- [x] 3.1 Add `deleteMedia(key)` to `src/content/media.ts` — S3 `DeleteObjectCommand` and local `public/uploads` unlink, symmetric with `saveUpload`/`listMedia`
- [x] 3.2 Add an image-reference scan in `src/content/admin.ts` (sibling to `findReferences`) that scans `featuredImage` across all four content types and venue `images[]` for an image URL, returning the referencing items
- [x] 3.3 Ensure the scan compares on the same representation media is keyed by (resolve key→URL via the existing `mediaUrl` logic) so references aren't missed

## 4. Media library page (#2)

- [x] 4.1 Create `/beheer/galerij` (`requireAdmin`, `force-dynamic`) rendering `listMedia()` as a thumbnail grid, newest first, with an empty state
- [x] 4.2 Add an upload form on the page wired to a server action calling `saveUpload`, with `revalidatePath` of the library
- [x] 4.3 Add a per-image delete action that runs the reference scan; on references, block and name the using items; otherwise call `deleteMedia` and refresh the grid
- [x] 4.4 Add a "Galerij" link to the `AdminShell` backend navigation
- [x] 4.5 Add a "Galerij" link to the admin-presence banner (next to Overzicht) in `admin-bar-mount.tsx`

## 5. Organiser → location (#3)

- [x] 5.1 Add a Location `Select` (from `getVenues()`, with a "Geen locatie" empty option) to the Organiser create and edit forms
- [x] 5.2 Persist `location` in `createOrganiser`/`updateOrganiser` actions
- [x] 5.3 On the Organiser page, resolve the `location` slug to the venue and pass `{name, href}` to `ContactInfo`; render a "Locatie" row linking to `routes.venue(slug)`, omitting it gracefully if the venue no longer resolves
- [x] 5.4 Add an optional `location` row to `ContactInfo` (`src/components/content/contact-info.tsx`)

## 6. Social links (#4)

- [x] 6.1 Create a shared `SocialLinks` component rendering inline-SVG icons for the Common 5, showing only platforms that have a URL (no third-party scripts)
- [x] 6.2 Add curated social URL inputs (one per platform) to the Event and Organiser create/edit forms
- [x] 6.3 Persist `socials` in `createEvent`/`updateEvent` and `createOrganiser`/`updateOrganiser`
- [x] 6.4 Render `SocialLinks` on the Organiser page (within the contact block) and the Event page (near the meta/organiser line)

## 7. Verification

- [x] 7.1 Verify deleting an in-use image is blocked and names the references; deleting an unused image succeeds (local mode)
- [x] 7.2 Verify the restyled cover control works on all four forms and shows the filename
- [x] 7.3 Verify an organiser with a location shows a linking "Locatie" row; one without shows none; social rows render only set platforms on both event and organiser pages
- [x] 7.4 Run `npm run typecheck` and `npm run lint`
