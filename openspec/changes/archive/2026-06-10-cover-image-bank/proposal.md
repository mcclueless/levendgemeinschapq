## Why

The cover/featured-image field on every content type only lets an editor **upload a new file** — there is no way to see or reuse images already uploaded. Editors re-upload the same file repeatedly and can't pick a cover they used before. The request: a browsable **pool of existing cover images**, selectable from the cover-image field, with "upload new" still available. Scope is **cover images only** (events, venues, organisations, blog) — not inline/body images.

The IAM spike confirmed the SSR runtime already has `s3:ListBucket` on the media bucket, so listing the existing uploads needs **no infrastructure or permission changes**.

## What Changes

- Add `listMedia()` to `src/content/media.ts`: list the media store's `uploads/` prefix (S3 `ListObjectsV2`, with the same local-FS fallback as `saveUpload`), returning `{ url, key, size, lastModified }`, newest first. This is the pool — every previously uploaded image.
- Add a reusable **`<ImageField>`** client component that replaces the bare file input in every cover-image field. It shows the current cover as a preview and offers two ways to set it:
  - **Upload new** — the existing `<input type="file" name="image">` path.
  - **Choose existing** — a modal grid of the pool (passed in as props), selecting one sets a hidden `featuredImageUrl`.
- Wire `<ImageField>` into all cover fields: the **4 create** and **4 edit** form pages (server components) call `listMedia()` and pass the pool down.
- Update the create/update actions so the cover resolves as: **picked URL** (`featuredImageUrl`) ?? **newly uploaded file** (`saveUpload(image)`) ?? **keep existing** (edit only).
- Applies uniformly to Events, Venues, Organisations, and Blog posts.

## Capabilities

### Modified Capabilities
- `editorial-backend`: cover-image handling now lets editors **pick an existing image from a pool of all uploaded images**, in addition to uploading a new one, on every content type's create and edit forms.

## Non-goals

- **Inline / body images** in content (explicitly excluded — covers only).
- **A standalone media-management page**, tagging, search, or alt-text metadata store. The modal picker *is* the browse surface.
- **Deleting images** from the pool. (The runtime has `s3:DeleteObject`, but deletion needs a reference guard and is deferred.)
- **Thumbnail generation.** The grid uses lazy-loaded full images.

## Impact

- **Affected code:** `src/content/media.ts` (+`listMedia()`), a new `<ImageField>` component, the 8 cover-field spots (4 create + 4 edit forms), and the 8 actions (`create*` / `update*`). The picker pool is fetched server-side per form render (the `/beheer` pages are already `force-dynamic`, so the pool is always fresh, including just-uploaded images).
- **No schema change** — `featuredImage` already exists on all four content types.
- **No IAM change** — `s3:ListBucket` on `levende-gemeenschap-media` is already granted (verified).
- **Performance:** rendering a cover field now does one `ListObjectsV2` on `uploads/`; the picker grid lazy-loads full images. Fine at current scale; revisit (pagination/thumbnails) if the pool grows into the hundreds.
