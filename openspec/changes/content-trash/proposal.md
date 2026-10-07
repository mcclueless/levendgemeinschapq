## Why

"Verwijderen" in the backend removes a document from storage on the spot. One confirmed click and an event, location, organiser, blog post, or project is gone, with no way back: there is no S3 versioning, no lifecycle rule, and no copy anywhere. Hiding is the only reversible action, but a hidden item stays in the normal list and is not "thrown away". The administrator wants a trashcan: deleted items go somewhere they can be looked at and brought back, and only leaving the trashcan is final.

## What Changes

- **Deleting moves an item to the trash** instead of removing it. This applies to the Verwijderen action on every backend list and on the public admin banner, for all five content types. A trashed item disappears from the public site, from listings, counts, the index, and reference and slug checks, exactly as a deleted one does today.
- **A trash page** in the backend (`/beheer/prullenbak`) lists trashed items of every type with their title, type, and the date they were trashed, and offers **Herstellen** (restore) and **Definitief verwijderen** (permanent delete) per item, plus **Prullenbak leegmaken** to purge everything.
- **Restore brings an item back as hidden.** Nothing goes live again without a deliberate Publiceren. A restore is refused, with the blocking item named, when a new item has since taken the slug.
- **Retention is manual plus lazy expiry.** Items stay in the trash until purged by hand or until they are older than 30 days, in which case they are purged the next time the trash page is opened.
- **The referential-integrity guard moves to trash time** and keeps its current all-status strictness. A location or organiser that anything still references cannot be trashed, so nothing in the trash can dangle and purging needs no guard.
- **BREAKING** for the current meaning of Verwijderen: it is no longer immediate and irreversible. Permanent removal happens only from the trash page.

## Capabilities

### New Capabilities

None. The trash is a management behaviour of the existing editorial backend and a storage rule of the existing content store.

### Modified Capabilities

- `editorial-backend`: "Permanently delete events" becomes "move to trash"; the delete guard becomes the trash guard; new requirements for the trash listing, restore (as hidden, refused on a slug collision), permanent deletion from the trash, emptying the trash, and 30-day lazy expiry.
- `content-storage`: trashed documents are stored outside the per-type content prefixes and are excluded from rendering, listings, the derived index, and reference, slug, and permalink checks.
- `admin-presence`: the banner's Verwijderen moves the item to the trash rather than deleting it, with the same guard and the same return to the public listing.

## Impact

- **Storage** (`src/content/storage.ts`, `src/content/write.ts`): a trash prefix beside the content prefixes; trash, restore, and purge operations composed from the existing read, write, and remove. No change to the store interface or to either backend.
- **Actions** (`src/app/beheer/actions.ts`): `performDelete` becomes a move to the trash; new restore, purge, and empty-trash actions. `deleteFromPublic` follows the same path.
- **Backend UI**: the Verwijderen button and confirmation text on the per-type list and the public banner; a new trash page; a trash count tile on the dashboard and a nav entry in the admin shell.
- **Readers are untouched**: the public repository, admin lists, counts, reference guard, index build, importer, unique-slug and permalink checks all list per-type prefixes and never see the trash prefix.
- **Local development**: the trash lives under `content/trash/` and is ignored by git, since the committed `content/` is a build-time seed.
- **Inherited, not fixed**: the calendar importer de-duplicates against live events only, so a trashed feed event is re-created on the next sync. Today's hard delete behaves the same way.
- **Out of scope**: media and calendar feeds keep their current immediate delete; automatic expiry on a schedule; counting trashed items' images as "in use" in the gallery.
