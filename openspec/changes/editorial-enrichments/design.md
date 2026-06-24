## Context

The editorial backend (`/beheer`, single-admin interim auth, `AdminShell` chrome) lets the administrator create/edit Events, Venues, Organisers, and Blog posts. Cover images use a shared `ImageField` (`src/components/admin/image-field.tsx`) backed by `src/content/media.ts` (`saveUpload`, `listMedia` — but **no delete**). Content is MD/MDX with Zod frontmatter (`src/content/schema.ts`). `findReferences` in `src/content/admin.ts` already implements a reference guard for hiding venues/organisers. The just-shipped admin-presence layer adds a contextual banner on public content-item pages. The public Organiser/Venue pages share `ContactInfo` (`src/components/content/contact-info.tsx`).

## Goals / Non-Goals

**Goals:**
- Make the cover-image upload control visually consistent with the gallery button — once, in the shared component.
- Give the administrator a real media library: browse, upload, and reference-safe delete.
- Let an Organiser link to a Location, surfaced as a link in its contact block.
- Let Organisers and Events show social profile links.

**Non-Goals:**
- Embedded/live social feeds (rejected: third-party scripts, consent gating, API tokens, ongoing breakage).
- Extending the hide-guard to organiser→venue references (link-only; a hidden venue may leave a dangling link, accepted).
- Multi-user/role concerns.

## Decisions

### D1 — Restyle the one shared `ImageField`, not four forms
The native `<input type="file">` "Choose file" button is browser chrome that cannot be CSS-styled. Replace the visible input with a styled "Bestand kiezen" button (matching "Kies uit galerij") that `.click()`s a visually-hidden native input, and render the chosen filename. Because `ImageField` is shared by all four content forms, the single change covers Events/Venues/Organisers/Blog.

### D2 — Standalone media library at `/beheer/galerij`
A new backend page lists `listMedia()` as a thumbnail grid, with an upload form (`saveUpload`) and per-image delete. Reachable from `AdminShell` nav and a "Galerij" link in the admin-presence banner. The banner is per-item, so it only *links* to the library; it does not host it.

### D3 — `deleteMedia(key)` mirrors the storage split
Add `deleteMedia(key)` to `media.ts`: `DeleteObjectCommand` against `S3_MEDIA_BUCKET` in deployment, `fs.unlink` under `public/uploads` locally — symmetric with `saveUpload`/`listMedia`.

### D4 — Reference-safe deletion reuses the existing guard pattern
Add an image-reference scan in `content/admin.ts` (sibling to `findReferences`) that scans every content document's `featuredImage` (all four types) and each Venue's `images[]` for the target image URL, returning the referencing items. The delete action blocks when the scan is non-empty and names the references — exactly the shape of the venue/organiser hide guard (design D3), so the rule reads consistently. This scan is the bulk of the work.
- *Alternative rejected:* hard delete or warn-and-allow — both can silently break live pages; the codebase already established block-on-reference as the norm.

### D5 — Organiser→Location is a slug reference, link-only
`OrganiserFrontmatter` gains `location?: string` (a venue slug). The form reuses the event form's Venue `Select` (from `getVenues()`), with an empty "Geen locatie" option. On render, the Organiser page resolves the slug to `{name, href}` (via the venue repository) and `ContactInfo` shows a "Locatie" row linking to `routes.venue(slug)`. Deliberately not added to `findReferences`, so hiding the venue can dangle the link — accepted to keep scope tight.

### D6 — Social links as a curated `socials` object + shared icon component
Add an optional `socials` object to both `EventFrontmatter` and `OrganiserFrontmatter` with optional URL fields for the Common 5 (instagram, facebook, x, linkedin, youtube). Curated fixed fields keep the form trivial (plain URL inputs) and the icon mapping static. A new `SocialLinks` component renders only the set platforms as inline-SVG icon links (no dependency, no third-party scripts, no consent gating). Placement: inside the contact block on Organiser pages; near the meta/organiser line on Event pages.

## Risks / Trade-offs

- **Image-reference scan cost** → The scan reads all content to check usage. Writes (deletes) are rare and the content set is small, so a full scan per delete is acceptable; it reuses the same read paths as `findReferences`.
- **URL-vs-key matching in the scan** → `featuredImage` is stored as a public URL while media is keyed by storage key; the scan must compare on the same representation (resolve key→URL via the same `mediaUrl` logic) or it will miss references and wrongly allow a delete. Explicit test: an in-use cover blocks deletion in both S3 and local modes.
- **Dangling organiser→location link** → A hidden/removed venue leaves the Organiser's "Locatie" link pointing at a 404. Accepted (link-only by decision); the render should fail gracefully (omit the row if the venue no longer resolves).
- **Social URL validation** → Inputs are typed `url`; the schema validates URL shape but not that the URL belongs to the claimed platform. Acceptable — the admin is trusted.
- **Backward compatibility** → All new frontmatter fields are optional, so existing documents parse unchanged.

## Migration Plan

Additive; no data migration. Existing documents without `location`/`socials` parse and render exactly as before.
1. Schema: add optional `location` (organiser) and `socials` (event + organiser).
2. `media.ts`: add `deleteMedia`; `admin.ts`: add the image-reference scan.
3. Build `/beheer/galerij` (browse/upload/delete) + server actions; add nav + banner links.
4. Restyle `ImageField`; add `SocialLinks` + icons; add the Location row to `ContactInfo`.
5. Wire form fields (organiser Location selector; event + organiser social inputs) and render social rows / location row on the public pages.

Rollback: remove the library page/actions, the new component/fields, and the schema additions; optional fields left in any saved documents are simply ignored.

## Open Questions

- None blocking. Exact icon glyphs and the precise visual placement of the social row are implementation details constrained by the design-system delta.
