// Reused by the `reindex` CLI as well as the app, so no `server-only` guard here.
import { CONTENT_PREFIX, getStore } from "./storage";
import { parseAll } from "./parse";

/**
 * Derived content index (design D3). A rebuildable cache over the S3/FS source
 * of truth that makes listings, lookups, and import de-duplication cheap.
 * It is NOT authoritative — `reindex` can always rebuild it from documents.
 */
export interface ContentIndex {
  generatedAt: string;
  counts: Record<"events" | "venues" | "organisers" | "posts", number>;
  events: Array<{
    slug: string;
    title: string;
    start: string;
    venue: string;
    organiser: string;
    status: string;
    uid?: string;
    recurring: boolean;
  }>;
  venues: Array<{ slug: string; name: string; status: string }>;
  organisers: Array<{ slug: string; name: string; status: string }>;
  posts: Array<{ slug: string; title: string; date: string; status: string }>;
  /** calendar UID -> event slug, for import de-duplication. */
  uids: Record<string, string>;
}

const INDEX_KEY = ".index.json";

export async function buildIndex(): Promise<ContentIndex> {
  const store = getStore();
  const [events, venues, organisers, posts] = await Promise.all([
    store.readPrefix(CONTENT_PREFIX.event).then((d) => parseAll("event", d)),
    store.readPrefix(CONTENT_PREFIX.venue).then((d) => parseAll("venue", d)),
    store
      .readPrefix(CONTENT_PREFIX.organiser)
      .then((d) => parseAll("organiser", d)),
    store.readPrefix(CONTENT_PREFIX.blog).then((d) => parseAll("blog", d)),
  ]);

  const uids: Record<string, string> = {};
  for (const e of events) if (e.data.uid) uids[e.data.uid] = e.slug;

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      events: events.length,
      venues: venues.length,
      organisers: organisers.length,
      posts: posts.length,
    },
    events: events.map((e) => ({
      slug: e.slug,
      title: e.data.title,
      start: e.data.start.toISOString(),
      venue: e.data.venue,
      organiser: e.data.organiser,
      status: e.data.status,
      uid: e.data.uid,
      recurring: Boolean(e.data.recurrence),
    })),
    venues: venues.map((v) => ({
      slug: v.slug,
      name: v.data.name,
      status: v.data.status,
    })),
    organisers: organisers.map((o) => ({
      slug: o.slug,
      name: o.data.name,
      status: o.data.status,
    })),
    posts: posts.map((p) => ({
      slug: p.slug,
      title: p.data.title,
      date: p.data.date.toISOString(),
      status: p.data.status,
    })),
    uids,
  };
}

/** Build and persist the index snapshot to the content store. */
export async function writeIndex(): Promise<ContentIndex> {
  const index = await buildIndex();
  await getStore().write(INDEX_KEY, JSON.stringify(index, null, 2));
  return index;
}

/** Read the persisted index snapshot, if present. */
export async function readIndex(): Promise<ContentIndex | null> {
  const raw = await getStore().read(INDEX_KEY);
  return raw ? (JSON.parse(raw) as ContentIndex) : null;
}
