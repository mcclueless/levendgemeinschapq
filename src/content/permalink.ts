import matter from "gray-matter";
import { CONTENT_PREFIX, getStore } from "./storage";
import { patchFrontmatter, slugify } from "./write";
import { listFeeds, updateFeed } from "./feeds";
import {
  REFERENCE_FIELDS,
  referrerKindsOf,
  rewriteReferences,
  type ReferrerKind,
} from "./references";

/**
 * Permalink (slug) changes for Locations, Organisers, and Projects
 * (editable-permalinks). A slug is at once the storage key, the public URL, and
 * the string other documents store to point at the item, and the store offers
 * neither rename nor transactions. So a rename is a sequence of plain writes,
 * ordered so every reference resolves at every step (D3):
 *
 *   1. copy   <prefix>/<from>.mdx → <prefix>/<to>.mdx
 *   2. patch  every referrer, any status, feeds included: from → to
 *   3. remove <prefix>/<from>.mdx — only once nothing points at it
 *
 * A failure part-way leaves both documents in place, and repeating the same
 * request resumes rather than being refused as "taken" (D4). No redirect is kept:
 * the old URL simply stops existing.
 */

export type PermalinkType = "venue" | "organiser" | "project";

export const PERMALINK_TYPES: readonly PermalinkType[] = ["venue", "organiser", "project"];

export function isPermalinkType(type: string): type is PermalinkType {
  return (PERMALINK_TYPES as readonly string[]).includes(type);
}

/**
 * Why a rename was refused. `missing` means the source no longer exists — most
 * likely because the same rename already completed.
 */
export type PermalinkRefusal = "empty" | "unchanged" | "taken" | "missing";

export interface RewrittenReferrer {
  kind: ReferrerKind;
  /** Content slug, or feed id. */
  slug: string;
}

export type PermalinkResult =
  | { ok: true; slug: string; referrers: RewrittenReferrer[] }
  | { ok: false; reason: PermalinkRefusal };

/** Content types backing each referrer kind (feeds are handled separately). */
const CONTENT_KIND = {
  event: "event",
  project: "project",
  blog: "blog",
  organiser: "organiser",
} as const;

function keyFor(type: PermalinkType, slug: string): string {
  return `${CONTENT_PREFIX[type]}/${slug}.mdx`;
}

/** Only the reference fields `rewriteReferences` changed, as a patch. */
function changedFields(
  kind: ReferrerKind,
  type: "venue" | "organiser",
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const field of REFERENCE_FIELDS[kind][type] ?? []) {
    if (after[field] !== before[field]) patch[field] = after[field];
  }
  return patch;
}

/**
 * Change the permalink of a Location, Organiser, or Project. `requested` is
 * normalised with the same `slugify` used for generated slugs. A taken slug is
 * refused, never suffixed — including one held by a hidden or draft item, since
 * existence is checked against the store directly.
 */
export async function changePermalink(
  type: PermalinkType,
  from: string,
  requested: string,
): Promise<PermalinkResult> {
  const to = slugify(requested);
  if (!to) return { ok: false, reason: "empty" };
  if (to === from) return { ok: false, reason: "unchanged" };

  const store = getStore();
  const [source, target] = await Promise.all([
    store.read(keyFor(type, from)),
    store.read(keyFor(type, to)),
  ]);
  if (source == null) return { ok: false, reason: "missing" };

  // Step 1, or resume (D4): an identical copy at the target is this rename's
  // own earlier, interrupted step 1; anything else there is another item.
  if (target == null) {
    await store.write(keyFor(type, to), source);
  } else if (target !== source) {
    return { ok: false, reason: "taken" };
  }

  // Step 2. Projects have no inbound references.
  const referrers: RewrittenReferrer[] = [];
  if (type === "venue" || type === "organiser") {
    for (const kind of referrerKindsOf(type)) {
      if (kind === "feed") {
        for (const feed of await listFeeds()) {
          const patched = rewriteReferences({ ...feed }, kind, type, from, to);
          if (!patched) continue;
          await updateFeed(feed.id, changedFields(kind, type, { ...feed }, patched));
          referrers.push({ kind, slug: feed.id });
        }
        continue;
      }
      const contentType = CONTENT_KIND[kind];
      // Raw frontmatter rather than `parseAll`: a document that fails schema
      // validation still holds a reference, and must not be left dangling.
      for (const doc of await store.readPrefix(CONTENT_PREFIX[contentType])) {
        const data = matter(doc.raw).data as Record<string, unknown>;
        const patched = rewriteReferences(data, kind, type, from, to);
        if (!patched) continue;
        await patchFrontmatter(contentType, doc.slug, changedFields(kind, type, data, patched));
        referrers.push({ kind, slug: doc.slug });
      }
    }
  }

  // Step 3: nothing points at `from` any more.
  await store.remove(keyFor(type, from));
  return { ok: true, slug: to, referrers };
}
