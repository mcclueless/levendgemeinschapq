import "server-only";
import matter from "gray-matter";
import { CONTENT_PREFIX, getStore } from "./storage";
import { parseAll, parseDoc, type ParsedDoc } from "./parse";
import type { ContentType, PublishStatus, frontmatterByType } from "./schema";
import { z } from "zod";
import { routes } from "@/lib/routes";

/**
 * Admin-side content access (user-roles-approval spec). Unlike the public
 * repository, these read all statuses so the approval queue can show pending
 * submissions — with enough detail to review them.
 */

export interface PendingEvent {
  kind: "event";
  slug: string;
  title: string;
  start: string;
  end?: string;
  venueSlug: string;
  venueName: string;
  organiserSlug: string;
  organiserName: string;
  recurrence?: "weekly" | "monthly";
  excerpt?: string;
  body: string;
  featuredImage?: string;
  submittedBy?: string;
  submittedAt?: string;
  reviewNote?: string;
}

export interface PendingPost {
  kind: "blog";
  slug: string;
  title: string;
  author: string;
  date: string;
  excerpt?: string;
  body: string;
  featuredImage?: string;
  submittedBy?: string;
  submittedAt?: string;
  reviewNote?: string;
}

export type Submission = PendingEvent | PendingPost;

export async function getPendingSubmissions(): Promise<Submission[]> {
  const store = getStore();
  const [events, posts, venues, organisers] = await Promise.all([
    store.readPrefix(CONTENT_PREFIX.event).then((d) => parseAll("event", d)),
    store.readPrefix(CONTENT_PREFIX.blog).then((d) => parseAll("blog", d)),
    store.readPrefix(CONTENT_PREFIX.venue).then((d) => parseAll("venue", d)),
    store
      .readPrefix(CONTENT_PREFIX.organiser)
      .then((d) => parseAll("organiser", d)),
  ]);

  const venueName = new Map(venues.map((v) => [v.slug, v.data.name]));
  const organiserName = new Map(organisers.map((o) => [o.slug, o.data.name]));
  const label = (map: Map<string, string>, slug: string) =>
    map.get(slug) ?? `${slug} (onbekend)`;

  const submissions: Submission[] = [];

  for (const e of events) {
    if (e.data.status !== "pending") continue;
    submissions.push({
      kind: "event",
      slug: e.slug,
      title: e.data.title,
      start: e.data.start.toISOString(),
      end: e.data.end?.toISOString(),
      venueSlug: e.data.venue,
      venueName: label(venueName, e.data.venue),
      organiserSlug: e.data.organiser,
      organiserName: label(organiserName, e.data.organiser),
      recurrence: e.data.recurrence?.freq,
      excerpt: e.data.excerpt,
      body: e.body,
      featuredImage: e.data.featuredImage,
      submittedBy: e.data.submittedBy,
      submittedAt: e.data.submittedAt?.toISOString(),
      reviewNote: e.data.reviewNote,
    });
  }

  for (const p of posts) {
    if (p.data.status !== "pending") continue;
    submissions.push({
      kind: "blog",
      slug: p.slug,
      title: p.data.title,
      author: p.data.author,
      date: p.data.date.toISOString(),
      excerpt: p.data.excerpt,
      body: p.body,
      featuredImage: p.data.featuredImage,
      submittedBy: p.data.submittedBy,
      submittedAt: p.data.submittedAt?.toISOString(),
      reviewNote: p.data.reviewNote,
    });
  }

  // Soonest submissions first; undated last.
  return submissions.sort((a, b) =>
    (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""),
  );
}

// ── Manage existing content (manage-existing-content change) ─────────────────

const PUBLIC_PATH = {
  event: routes.event,
  venue: routes.venue,
  organiser: routes.organiser,
  blog: routes.post,
  project: routes.project,
} as const;

export interface ContentListItem {
  type: ContentType;
  slug: string;
  /** Title for events/blog, name for venues/organisers. */
  title: string;
  status: PublishStatus;
  /** Public URL of the item. */
  href: string;
}

/**
 * All items of a content type, regardless of publication status, for the
 * backend management list. Sorted newest-first for dated types (events by
 * start, blog by date) and alphabetically for venues/organisers.
 */
export async function listContent(type: ContentType): Promise<ContentListItem[]> {
  const docs = parseAll(type, await getStore().readPrefix(CONTENT_PREFIX[type]));
  const items = docs.map((d) => {
    const data = d.data as Record<string, unknown>;
    const title = (data.title ?? data.name ?? d.slug) as string;
    const sortKey =
      type === "event"
        ? (data.start as Date)?.toISOString?.() ?? ""
        : type === "blog" || type === "project"
          ? (data.date as Date)?.toISOString?.() ?? ""
          : title.toLowerCase();
    return {
      type,
      slug: d.slug,
      title,
      status: data.status as PublishStatus,
      href: PUBLIC_PATH[type](d.slug),
      sortKey,
    };
  });
  const dated = type === "event" || type === "blog" || type === "project";
  items.sort((a, b) =>
    dated ? b.sortKey.localeCompare(a.sortKey) : a.sortKey.localeCompare(b.sortKey),
  );
  return items.map((i) => ({
    type: i.type,
    slug: i.slug,
    title: i.title,
    status: i.status,
    href: i.href,
  }));
}

export interface ContentReference {
  kind: "event" | "blog";
  slug: string;
  title: string;
  href: string;
}

/**
 * Content that links to the given item, so an action that would orphan it can
 * be blocked and the referrers reported (design D3): a Venue/Organiser may be
 * referenced by Events (venue/organiser) and Blog posts (relations). Returns
 * empty for event/blog targets — nothing links to them.
 *
 * By default only **published** referrers count — the right scope for hiding,
 * which protects live public links. Pass `includeHidden: true` for the stricter
 * scope used by permanent deletion: an irreversible delete must also be blocked
 * by hidden/draft referrers, which would otherwise dangle if re-published.
 */
export async function findReferences(
  type: ContentType,
  slug: string,
  { includeHidden = false }: { includeHidden?: boolean } = {},
): Promise<ContentReference[]> {
  if (type !== "venue" && type !== "organiser") return [];

  const store = getStore();
  const refs: ContentReference[] = [];

  const [events, posts] = await Promise.all([
    store.readPrefix(CONTENT_PREFIX.event).then((d) => parseAll("event", d)),
    store.readPrefix(CONTENT_PREFIX.blog).then((d) => parseAll("blog", d)),
  ]);

  for (const e of events) {
    if (!includeHidden && e.data.status !== "published") continue;
    const hit =
      type === "venue" ? e.data.venue === slug : e.data.organiser === slug;
    if (hit) {
      refs.push({
        kind: "event",
        slug: e.slug,
        title: e.data.title,
        href: routes.event(e.slug),
      });
    }
  }

  for (const p of posts) {
    if (!includeHidden && p.data.status !== "published") continue;
    const list =
      type === "venue" ? p.data.relatedVenues : p.data.relatedOrganisers;
    if (list.includes(slug)) {
      refs.push({
        kind: "blog",
        slug: p.slug,
        title: p.data.title,
        href: routes.post(p.slug),
      });
    }
  }

  return refs;
}

export interface ImageReference {
  kind: ContentType;
  slug: string;
  title: string;
  href: string;
}

/**
 * Content that uses the given image URL — as a cover image (any type) or in a
 * Venue gallery — so deleting an in-use library image can be blocked and the
 * users reported (editorial-enrichments). Checks every status, so an image used
 * only by a draft is still protected. Compares on the stored URL form, which is
 * the same representation `media.ts` produces for both S3 and local backends.
 */
export async function findImageReferences(
  url: string,
): Promise<ImageReference[]> {
  const store = getStore();
  const [events, venues, organisers, posts] = await Promise.all([
    store.readPrefix(CONTENT_PREFIX.event).then((d) => parseAll("event", d)),
    store.readPrefix(CONTENT_PREFIX.venue).then((d) => parseAll("venue", d)),
    store
      .readPrefix(CONTENT_PREFIX.organiser)
      .then((d) => parseAll("organiser", d)),
    store.readPrefix(CONTENT_PREFIX.blog).then((d) => parseAll("blog", d)),
  ]);

  const refs: ImageReference[] = [];
  for (const e of events) {
    if (e.data.featuredImage === url) {
      refs.push({ kind: "event", slug: e.slug, title: e.data.title, href: routes.event(e.slug) });
    }
  }
  for (const v of venues) {
    if (v.data.featuredImage === url || v.data.images.includes(url)) {
      refs.push({ kind: "venue", slug: v.slug, title: v.data.name, href: routes.venue(v.slug) });
    }
  }
  for (const o of organisers) {
    if (o.data.featuredImage === url) {
      refs.push({ kind: "organiser", slug: o.slug, title: o.data.name, href: routes.organiser(o.slug) });
    }
  }
  for (const p of posts) {
    if (p.data.featuredImage === url) {
      refs.push({ kind: "blog", slug: p.slug, title: p.data.title, href: routes.post(p.slug) });
    }
  }
  return refs;
}

type FrontmatterOf<K extends ContentType> = z.infer<
  (typeof frontmatterByType)[K]
>;

export type EditableDoc<K extends ContentType> = ParsedDoc<FrontmatterOf<K>> & {
  /** Unparsed frontmatter (string values), for round-tripping date inputs. */
  fm: Record<string, unknown>;
};

/**
 * Load a single document of any status for the edit form. Returns null if it
 * does not exist or fails validation. Includes the unparsed frontmatter (`fm`)
 * so date/datetime fields can be prefilled with their stored string form.
 */
export async function getEditable<K extends ContentType>(
  type: K,
  slug: string,
): Promise<EditableDoc<K> | null> {
  const key = `${CONTENT_PREFIX[type]}/${slug}.mdx`;
  const raw = await getStore().read(key);
  if (raw == null) return null;
  try {
    const parsed = parseDoc(type, { key, slug, raw });
    return { ...parsed, fm: matter(raw).data };
  } catch {
    return null;
  }
}

/** Counts for the dashboard. */
export async function getContentCounts() {
  const store = getStore();
  const [events, venues, organisers, posts, projects] = await Promise.all([
    store.readPrefix(CONTENT_PREFIX.event).then((d) => parseAll("event", d)),
    store.readPrefix(CONTENT_PREFIX.venue).then((d) => parseAll("venue", d)),
    store.readPrefix(CONTENT_PREFIX.organiser).then((d) => parseAll("organiser", d)),
    store.readPrefix(CONTENT_PREFIX.blog).then((d) => parseAll("blog", d)),
    store.readPrefix(CONTENT_PREFIX.project).then((d) => parseAll("project", d)),
  ]);
  const pending =
    events.filter((e) => e.data.status === "pending").length +
    posts.filter((p) => p.data.status === "pending").length;
  return {
    events: events.length,
    venues: venues.length,
    organisers: organisers.length,
    posts: posts.length,
    projects: projects.length,
    pending,
  };
}
