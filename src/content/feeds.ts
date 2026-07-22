import matter from "gray-matter";
import { z } from "zod";
import { getStore } from "./storage";
import { slugify } from "./write";

/**
 * Saved calendar feeds (add-managed-calendar-feeds).
 *
 * A feed is **configuration, not content**, so it is deliberately NOT registered
 * in `ContentType` (design D1). A feed has no public page, so `PUBLIC_PATH`,
 * `PUBLIC_LIST_PATH` and `itemPath()` — all total Records over the content types
 * precisely so a missing public URL is a compile error — would each need an
 * invented path, and `listContent` assumes a `PublishStatus` a feed does not
 * have.
 *
 * It does reuse `getStore()`, so the S3-in-production / local-filesystem-in-dev
 * split is inherited for free. Every existing reader enumerates its prefixes
 * explicitly, so this prefix is invisible to all of them.
 */

export const FEED_PREFIX = "feeds";

export const FeedFrontmatter = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  /** Applied to entries whose location does not match a known venue. */
  defaultVenue: z.string().min(1),
  defaultOrganiser: z.string().min(1),
  /**
   * A paused feed keeps its URL and defaults but is skipped by "Sync alle"
   * (design D11). It can still be synced deliberately — pausing governs the
   * bulk action, not the explicit one.
   */
  paused: z.boolean().default(false),
  lastSyncedAt: z.coerce.date().optional(),
  lastCreated: z.number().int().nonnegative().optional(),
  lastSkipped: z.number().int().nonnegative().optional(),
  lastHidden: z.number().int().nonnegative().optional(),
  lastFlagged: z.number().int().nonnegative().optional(),
  /** Reason the most recent sync failed; cleared on a successful sync. */
  lastError: z.string().optional(),
});
export type FeedFrontmatter = z.infer<typeof FeedFrontmatter>;

export interface Feed extends FeedFrontmatter {
  /** Slug derived from the label; the feed's stable id, stamped onto events. */
  id: string;
}

function keyFor(id: string): string {
  return `${FEED_PREFIX}/${id}.mdx`;
}

/** Serialize, dropping empty values so they don't appear as `null` in YAML. */
function serialize(data: Record<string, unknown>): string {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== ""),
  );
  return matter.stringify("\n", clean);
}

export async function listFeeds(): Promise<Feed[]> {
  const docs = await getStore().readPrefix(FEED_PREFIX);
  const feeds: Feed[] = [];
  for (const doc of docs) {
    const parsed = FeedFrontmatter.safeParse(matter(doc.raw).data);
    if (!parsed.success) {
      console.error(`[feeds] skipped invalid feed: ${doc.key}`);
      continue;
    }
    feeds.push({ id: doc.slug, ...parsed.data });
  }
  return feeds.sort((a, b) => a.label.localeCompare(b.label, "nl"));
}

export async function getFeed(id: string): Promise<Feed | null> {
  const raw = await getStore().read(keyFor(id));
  if (raw == null) return null;
  const parsed = FeedFrontmatter.safeParse(matter(raw).data);
  return parsed.success ? { id, ...parsed.data } : null;
}

/** Ensure a unique id within the feed prefix. */
async function uniqueId(base: string): Promise<string> {
  const store = getStore();
  let id = base || "agenda";
  let n = 2;
  while ((await store.read(keyFor(id))) !== null) id = `${base}-${n++}`;
  return id;
}

export async function createFeed(
  data: Omit<FeedFrontmatter, "paused"> & { paused?: boolean },
): Promise<string> {
  const id = await uniqueId(slugify(data.label));
  await getStore().write(keyFor(id), serialize({ paused: false, ...data }));
  return id;
}

/**
 * Patch a feed in place. Merges over the stored frontmatter so fields the
 * caller does not mention — sync bookkeeping in particular — survive an edit
 * of the URL or defaults.
 */
export async function updateFeed(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const store = getStore();
  const raw = await store.read(keyFor(id));
  if (raw == null) throw new Error(`Feed not found: ${id}`);
  const { data } = matter(raw);
  await store.write(keyFor(id), serialize({ ...data, ...patch }));
}

/**
 * Remove a feed. Its events are deliberately left untouched (design D9): once
 * imported, the site owns the event. Deleting a feed is tidying a list, not a
 * destructive content operation.
 */
export async function deleteFeed(id: string): Promise<void> {
  await getStore().remove(keyFor(id));
}
