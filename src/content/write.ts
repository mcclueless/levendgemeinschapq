import matter from "gray-matter";
import {
  CONTENT_PREFIX,
  TRASH_PREFIX,
  getStore,
  trashKeyFor,
  type ContentStore,
} from "./storage";
import type { ContentType, PublishStatus } from "./schema";

/**
 * Content authoring (design D2/D4). Writes MD/MDX documents back to the store
 * and updates publication state, so the editorial backend and approval queue
 * have a single, validated write path.
 */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function keyFor(type: ContentType, slug: string): string {
  return `${CONTENT_PREFIX[type]}/${slug}.mdx`;
}

/** Ensure a unique slug within a content type. */
async function uniqueSlug(type: ContentType, base: string): Promise<string> {
  const store = getStore();
  let slug = base || "item";
  let n = 2;
  while ((await store.read(keyFor(type, slug))) !== null) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Serialize frontmatter + body into an MDX document string. */
function serialize(frontmatter: Record<string, unknown>, body: string): string {
  // Drop undefined values so they don't appear as `null` in YAML.
  const clean = Object.fromEntries(
    Object.entries(frontmatter).filter(([, v]) => v !== undefined && v !== ""),
  );
  return matter.stringify(body.trim() ? `\n${body.trim()}\n` : "\n", clean);
}

export interface CreateResult {
  slug: string;
  key: string;
}

/** Create a new document of `type`. Returns the assigned slug. */
export async function createDocument(
  type: ContentType,
  titleForSlug: string,
  frontmatter: Record<string, unknown>,
  body = "",
): Promise<CreateResult> {
  const slug = await uniqueSlug(type, slugify(titleForSlug));
  const key = keyFor(type, slug);
  await getStore().write(key, serialize(frontmatter, body));
  return { slug, key };
}

/** Patch a document's frontmatter (e.g. status changes) in place. */
export async function patchFrontmatter(
  type: ContentType,
  slug: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const store = getStore();
  const key = keyFor(type, slug);
  const raw = await store.read(key);
  if (raw == null) throw new Error(`Document not found: ${key}`);
  const { data, content } = matter(raw);
  await store.write(key, serialize({ ...data, ...patch }, content));
}

/**
 * Pure merge of an existing document's `raw` source with a frontmatter `patch`
 * and a new `body`. Frontmatter keys not present in `patch` are preserved (so
 * form-absent fields like a calendar `uid`, venue `images`, organiser
 * gallery images, blog relations, and submission metadata survive an edit); keys
 * set to `undefined`/`""` are dropped. Extracted as a pure function so the
 * merge contract can be unit-tested without the store.
 */
export function mergeDocument(
  raw: string,
  patch: Record<string, unknown>,
  body: string,
): string {
  const { data } = matter(raw);
  return serialize({ ...data, ...patch }, body);
}

/**
 * Edit an existing document in place: merge the frontmatter `patch` over the
 * stored frontmatter and replace the body. The slug (and thus the storage key,
 * public URL, and index entry) is unchanged. Keys omitted from `patch` are
 * preserved (see {@link mergeDocument}).
 */
export async function updateDocument(
  type: ContentType,
  slug: string,
  patch: Record<string, unknown>,
  body: string,
): Promise<void> {
  const store = getStore();
  const key = keyFor(type, slug);
  const raw = await store.read(key);
  if (raw == null) throw new Error(`Document not found: ${key}`);
  await store.write(key, mergeDocument(raw, patch, body));
}

/** Permanently remove a document from storage. Irreversible. */
export async function deleteDocument(
  type: ContentType,
  slug: string,
): Promise<void> {
  await getStore().remove(keyFor(type, slug));
}

export async function setStatus(
  type: ContentType,
  slug: string,
  status: PublishStatus,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await patchFrontmatter(type, slug, { status, ...extra });
}

// ── Trash (content-trash) ────────────────────────────────────────────────────
// "Verwijderen" moves a document to the trash prefix instead of removing it;
// only purging from the trash is final. The helpers take an optional store so
// they can be exercised against a temp-dir LocalFsStore in tests.

/** How long a trashed document is kept before the trash page purges it (D6). */
export const TRASH_RETENTION_DAYS = 30;
const RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** Pure: stamp the moment of trashing into the frontmatter, nothing else. */
export function markTrashed(raw: string, trashedAt: Date): string {
  const { data, content } = matter(raw);
  // An ISO string, not a Date: js-yaml would emit a Date unquoted and read it
  // back as a Date, and both backends must store exactly the same bytes.
  return serialize({ ...data, trashedAt: trashedAt.toISOString() }, content);
}

/**
 * Pure: drop the trash stamp and land the document as hidden (D4), so that a
 * restore never republishes anything without a deliberate "Publiceren".
 */
export function markRestored(raw: string): string {
  const { data, content } = matter(raw);
  return serialize({ ...data, trashedAt: undefined, status: "draft" }, content);
}

/**
 * Move a live document to the trash. Write-then-remove (D2): a crash between
 * the two steps leaves a duplicate, never a loss. Returns false when there is
 * nothing live to trash.
 */
export async function trashDocument(
  type: ContentType,
  slug: string,
  now: Date = new Date(),
  store: ContentStore = getStore(),
): Promise<boolean> {
  const key = keyFor(type, slug);
  const raw = await store.read(key);
  if (raw == null) return false;
  await store.write(trashKeyFor(type, slug), markTrashed(raw, now));
  await store.remove(key);
  return true;
}

export type RestoreResult =
  | { ok: true }
  /** Another document now has the slug; `title` names it (D5). */
  | { ok: false; reason: "taken"; title: string }
  /** The trashed document is gone — most likely already restored or purged. */
  | { ok: false; reason: "missing" };

/** Move a trashed document back under its type, hidden. Refuses a taken slug. */
export async function restoreDocument(
  type: ContentType,
  slug: string,
  store: ContentStore = getStore(),
): Promise<RestoreResult> {
  const trashKey = trashKeyFor(type, slug);
  const liveKey = keyFor(type, slug);
  const [raw, live] = await Promise.all([store.read(trashKey), store.read(liveKey)]);
  if (raw == null) return { ok: false, reason: "missing" };
  if (live != null) return { ok: false, reason: "taken", title: lenientTitle(live, slug) };
  await store.write(liveKey, markRestored(raw));
  await store.remove(trashKey);
  return { ok: true };
}

/** Permanently remove a trashed document. Irreversible; no guard (D3). */
export async function purgeDocument(
  type: ContentType,
  slug: string,
  store: ContentStore = getStore(),
): Promise<void> {
  await store.remove(trashKeyFor(type, slug));
}

export interface TrashItem {
  type: ContentType;
  slug: string;
  title: string;
  /** Null when the stamp is missing or unreadable; such an item counts as expired. */
  trashedAt: Date | null;
  expiresAt: Date | null;
}

/**
 * Title without running the type's schema (D7): a document trashed months
 * ago may predate a schema change, and that must never make it unlistable.
 */
function lenientTitle(raw: string, slug: string): string {
  try {
    const { data } = matter(raw);
    const t = data.title ?? data.name;
    return typeof t === "string" && t.trim() ? t : slug;
  } catch {
    return slug;
  }
}

function stampOf(raw: string): Date | null {
  let v: unknown;
  try {
    v = matter(raw).data.trashedAt;
  } catch {
    return null;
  }
  const d = v instanceof Date ? v : typeof v === "string" ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/** Every trashed document across all types, newest first; unstamped ones last. */
export async function listTrash(
  store: ContentStore = getStore(),
): Promise<TrashItem[]> {
  const types = Object.keys(CONTENT_PREFIX) as ContentType[];
  const perType = await Promise.all(
    types.map(async (type) => {
      const docs = await store.readPrefix(`${TRASH_PREFIX}/${CONTENT_PREFIX[type]}`);
      return docs.map((d): TrashItem => {
        const trashedAt = stampOf(d.raw);
        return {
          type,
          slug: d.slug,
          title: lenientTitle(d.raw, d.slug),
          trashedAt,
          expiresAt: trashedAt ? new Date(trashedAt.getTime() + RETENTION_MS) : null,
        };
      });
    }),
  );
  return perType.flat().sort((a, b) => {
    const ta = a.trashedAt?.getTime() ?? -Infinity;
    const tb = b.trashedAt?.getTime() ?? -Infinity;
    return tb - ta;
  });
}

/**
 * Purge every trashed document older than the retention period (D6). Runs when
 * the trash page is opened — the app has no scheduler. A document without a
 * readable stamp is treated as expired. Returns how many were removed.
 */
export async function purgeExpired(
  now: Date = new Date(),
  store: ContentStore = getStore(),
): Promise<number> {
  const items = await listTrash(store);
  const expired = items.filter(
    (i) => i.trashedAt === null || now.getTime() - i.trashedAt.getTime() > RETENTION_MS,
  );
  await Promise.all(expired.map((i) => purgeDocument(i.type, i.slug, store)));
  return expired.length;
}
