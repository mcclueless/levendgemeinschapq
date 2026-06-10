## Context

Today `saveUpload(file)` is the only media entry point: each cover field uploads a fresh file to `levende-gemeenschap-media/uploads/<base>-<size><ext>` and stores the returned URL in `featuredImage`. `media.ts` can only write — it cannot list. All uploads already live under one flat `uploads/` prefix, so the "pool" physically exists; it just isn't surfaced.

The `/beheer` pages are `force-dynamic`, and the IAM spike confirmed the SSR compute role (`LevendeGemeenschapAmplifyCompute` → `LevendeGemeenschapS3Access`) grants `s3:ListBucket` on the media bucket. So listing the pool at render time is both permitted and freshness-correct.

## Goals / Non-Goals

**Goal:** on every cover-image field (events, venues, organisers, blog; create + edit), let an editor pick an already-uploaded image or upload a new one.

**Non-goals:** inline/body images; a standalone library page; delete; tags/search; alt-text metadata; thumbnail generation.

## Decisions

### D1 — Pool source: list the media bucket (Option A)
`listMedia()` lists the `uploads/` prefix, returning every uploaded image (newest first). This is the true "all uploaded images" bank — a superset of images currently in use.

**Why not scan content frontmatter (Option B):** B needs no new permission but only surfaces images *currently* referenced by some item, so an image whose only item was later deleted vanishes from the pool even though the file still exists. The spike showed A needs no IAM change either, so A wins on completeness at no extra cost.

### D2 — Data flow: server-fetched pool passed as props
The create/edit pages are server components; they call `listMedia()` and pass the array to the client `<ImageField>`. No API route or client fetch is needed, and because `/beheer` is `force-dynamic` the pool reflects images uploaded moments earlier.

### D3 — Field contract: picked URL ?? new file ?? existing
`<ImageField>` submits one of: a hidden `featuredImageUrl` (a pool selection — already a hosted URL) or a file under the existing `image` input. Actions resolve in that order, falling back to the stored value on edit:
```
cover = featuredImageUrl ?? (await saveUpload(image)) ?? <unchanged>
```
This keeps the existing upload path intact (backward compatible) and only writes to S3 when a genuinely new file is provided — a pool pick costs no upload.

### D4 — No thumbnails; lazy full images
The grid renders the actual images with `loading="lazy"` and CSS sizing — consistent with the codebase's plain-`<img>` approach. Thumbnail generation is real image-processing infra and isn't warranted yet.

### D5 — Scope guard: covers only
`<ImageField>` is used solely for the `featuredImage` field. Bodies stay plain Markdown/MDX textareas; no inline image insertion. Delete/metadata/search are explicitly out.

## Risks / Trade-offs

- **Pool size:** `ListObjectsV2` returns up to 1000 keys and the grid renders all of them. At dozens of images this is fine; at hundreds, add newest-first pagination or a search box (deferred, noted).
- **Per-render list call:** each cover-field render does one S3 list. Cheap and the page is already dynamic; acceptable.
- **Mixed/legacy objects:** the pool shows everything under `uploads/`, including test images. Acceptable; reuse reduces future clutter (the `<base>-<size>` naming already dedups identical re-uploads).
- **Alt text:** unchanged — `featuredImage` alt is derived from the item title, so no accessibility regression.

## Migration

None. No schema, storage-layout, content, or IAM changes. Purely additive UI + a read helper; the existing upload path keeps working.
