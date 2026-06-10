## Why

The editorial backend (`/beheer`) can **create** Events, Venues, Organisations, and Blog posts and **approve/reject** queue submissions — but there is no way to **edit** or **remove** anything that already exists. An admin reported that he cannot edit or delete blog posts, organisations, and events and expects to be able to. This is correct: it contradicts the `editorial-backend` spec ("create **and edit** … all content types") and the `user-roles-approval` spec (administrators "SHALL view, **edit**, approve, publish, and **delete** any content"). It was an explicit follow-up deferred in `community-event-calendar` task 8.2 ("in-place edit of existing items is a follow-up"). This change closes that gap.

## What Changes

- Add a **content listing** view per type in the backend (`/beheer/[type]`) showing existing Events, Venues, Organisations, and Blog posts with their title and publication status, plus edit and hide/show actions.
- Add **in-place editing**: a prefilled form per item (`/beheer/[type]/[slug]/bewerken`) that updates the existing MD/MDX document. The slug stays stable on edit (stable public URLs and index entries); the update **merges** frontmatter so form-absent fields (event `uid`, venue `images`, blog relations, submission metadata) are preserved, not wiped.
- Add **"delete" as unpublish (hide)**: setting an item's status to `draft` removes it from the public site while keeping the document in storage; a republish action restores it.
- Add **permanent deletion of Events** (only): an admin can irreversibly remove an Event document from storage. Venues, Organisations, and Blog posts remain unpublish-only.
- Add a **referential-integrity guard** that blocks an action which would orphan a public link, listing the referencing items so the admin can resolve them first:
  - Hiding a Venue or Organisation referenced by a *published* Event or Blog post.
  - Events and Blog posts (which nothing references) can always be hidden, and Events can always be deleted.
- **Gate edit and hide/show on Administrator** authorization, consistent with the current single-admin interim auth.

Folded into this change (cover images & cleanup, reported alongside the above):

- **Cover images, uploadable and visible, for all content types.** Events already stored `featuredImage`; Venues and Organisations gain a `featuredImage` field with upload fields on their create/edit forms. Covers render as a hero on every detail page and as a thumbnail on listings. Blog covers (already stored) are now rendered too.
- **Default event cover.** Events always show a cover — the uploaded image, or a branded default placeholder (`/event-placeholder.svg`). Venues/Organisations/Blog posts show a cover only when one is uploaded.
- **Media URL fix (production).** With an S3 media bucket but no `NEXT_PUBLIC_MEDIA_BASE_URL`, uploads returned a site-relative `/uploads/…` path that 404s; they now fall back to the bucket's virtual-hosted S3 URL.
- **Removed the Organiser portfolio feature entirely.** It was hardcoded, file-only content with no backend editing; the schema field, type, component, detail-page section, and seed data are all removed. (This also retires the event reference-guard, which only existed to protect portfolio `eventRef` links.)

## Capabilities

### Modified Capabilities
- `editorial-backend`: Adds listing of existing content, in-place editing of existing items, hide (unpublish) / show (republish) with a referential-integrity guard, permanent event deletion, and image upload for venue/organiser covers. (Previously: create-only plus the approval queue.)
- `organisers`: Adds an optional cover image; **removes** the portfolio showcase.
- `events`, `venues`, `blog`: Add an optional/visible cover image (events fall back to a default placeholder).

## Non-goals

- **Hard deletion of Venues, Organisations, and Blog posts.** For those types "delete" is satisfied by unpublish (hide). Only Events support permanent deletion in this change.
- **Cleaning up orphaned media on delete.** Deleting an Event leaves its uploaded featured image in the media store. Media may be shared and pruning it is riskier than the delete itself, so it is out of scope (noted in design).
- **Slug renaming / URL redirects on edit.** The slug is fixed at creation and never changes on edit, so no redirect handling is needed.
- **Limited-user / per-organisation edit permissions.** Edit and hide/show are Administrator-only here. Ownership-scoped editing (limited users maintaining their own Organisation page) remains future work under `user-roles-approval`.

## Impact

- **Affected code:** `src/content/admin.ts` (list + reference lookup), `src/content/write.ts` (merge-update of frontmatter + body; unpublish reuses existing `setStatus`), `src/app/beheer/actions.ts` (update / hide / show actions, admin-gated), and new backend routes under `src/app/beheer/[type]` and `.../[slug]/bewerken`. The create form components are reused for editing.
- **No schema or storage-primitive changes.** All four types already carry a `status` field; public getters already filter `status === "published"`, so hiding takes effect within the existing ISR window. Writes reuse the existing `revalidatePublic()` path.
