## 1. Media listing (the pool)

- [x] 1.1 Add a `MediaItem` type (`{ url, key, size, lastModified }`) and `listMedia()` to `src/content/media.ts`: S3 `ListObjectsV2` on the `uploads/` prefix when `S3_MEDIA_BUCKET` is set, else read `public/uploads` (mirror `saveUpload`'s dual-backend), filtered to image extensions, sorted newest-first
- [x] 1.2 Build the media URL for each item the same way `saveUpload` does (explicit base URL, else virtual-hosted S3 URL, else `/uploads/<name>` locally)

## 2. Picker component

- [x] 2.1 Add `<ImageField>` client component: shows the current cover preview, a "Upload new" mode (`<input type="file" name="image">`) and a "Choose existing" mode that opens a modal grid of the pool (from props)
- [x] 2.2 Selecting a pool image sets a hidden `featuredImageUrl` and updates the preview; clearing/selecting upload clears it
- [x] 2.3 Grid images use `loading="lazy"`; modal is keyboard-accessible (focus, Esc to close)

## 3. Wire into forms

- [x] 3.1 Create forms — pass `listMedia()` pool into `<ImageField>` on `nieuw/evenement`, `nieuw/locatie`, `nieuw/organisator`, `nieuw/blog`
- [x] 3.2 Edit forms — same in `beheer/[type]/[slug]/bewerken` for all four branches, seeding the preview with the item's current `featuredImage`

## 4. Actions

- [x] 4.1 In `create{Event,Venue,Organiser,Blog}` and `update{Event,Venue,Organiser,Blog}`, resolve the cover as `featuredImageUrl ?? (await saveUpload(image)) ?? existing` (create has no "existing"); only call `saveUpload` when a new file is present

## 5. Verify

- [x] 5.1 Pick an existing image → it is stored as `featuredImage` with no new upload (S3 object count unchanged)
- [x] 5.2 Upload a new image → stored, set as cover, and appears in the pool on the next form open
- [x] 5.3 Edit and save without touching the cover → existing cover preserved
- [x] 5.4 All four content types, create and edit; `pnpm typecheck` / `lint` / `build` pass
- [x] 5.5 On deploy: confirm the pool lists the media bucket (`listMedia` returns the live uploads)
