import "server-only";
import { cache } from "react";
import matter from "gray-matter";
import { CONTENT_PREFIX, getStore } from "./storage";
import { parseAll, parseDoc, type ParsedDoc } from "./parse";
import type { ContentType, frontmatterByType } from "./schema";
import { z } from "zod";
import { routes } from "@/lib/routes";
import { listFeeds } from "./feeds";
import { pointsAt, type ReferrerKind } from "./references";
import { eventOrganiserSlugs, organisersLabel } from "./event-organisers";
import { organiserGallery } from "./organiser-images";
import { listSummaries } from "./summaries";
import { imageReferencesIn, type ImageReference, type ImageUser } from "./image-references";

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
  /** Absent when the event names none; see `label()` for what is displayed. */
  venueSlug?: string;
  venueName: string;
  /** Every organiser slug the event names; empty when it names none. */
  organiserSlugs: string[];
  organiserName: string;
  /**
   * The proposed series, not just its interval — a submitter can now say
   * "every week until December", and approving that unseen is not review
   * (add-recurrence-end-date D9). `until` stays optional: imported entries and
   * documents predating the end-date requirement are legitimately open-ended.
   */
  recurrence?: { freq: "weekly" | "monthly"; interval?: number; until?: string };
  excerpt?: string;
  body: string;
  featuredImage?: string;
  /** Submitted social links, so a reviewer judges the links before publishing. */
  socials?: Record<string, string>;
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
  // A reviewer has to tell a deliberate omission from broken data: an event may
  // name no venue or organiser at all, which is different from naming one that
  // no longer exists.
  const label = (map: Map<string, string>, slug: string | undefined, none: string) =>
    slug === undefined ? none : map.get(slug) ?? `${slug} (onbekend)`;

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
      venueName: label(venueName, e.data.venue, "Geen locatie"),
      organiserSlugs: eventOrganiserSlugs(e.data),
      organiserName: organisersLabel(e.data, organiserName),
      recurrence: e.data.recurrence
        ? {
            freq: e.data.recurrence.freq,
            interval: e.data.recurrence.interval,
            until: e.data.recurrence.until?.toISOString(),
          }
        : undefined,
      excerpt: e.data.excerpt,
      body: e.body,
      featuredImage: e.data.featuredImage,
      socials: e.data.socials,
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

/**
 * All items of a content type, regardless of publication status, for the
 * backend management list — as summaries (admin-content-table D2). The list
 * page orders them; see `applyListQuery`.
 */
export const listContent = listSummaries;
export type { ContentSummary } from "./summaries";

export interface ContentReference {
  kind: ReferrerKind;
  slug: string;
  title: string;
  /** Public page, or the backend edit page for a feed (it has no public page). */
  href: string;
}

/**
 * Content that links to the given item, so an action that would orphan it can
 * be blocked and the referrers reported (design D3). Which fields count as a
 * reference is defined once in `references.ts` (editable-permalinks D1): a
 * Venue may be referenced by Events, Projects, Blog posts, and Organisers'
 * locations; an Organiser by Events, Projects, and Blog posts. Returns empty
 * for event/blog/project targets — nothing links to them.
 *
 * By default only **published** referrers count — the right scope for hiding,
 * which protects live public links. Pass `includeHidden: true` for the stricter
 * scope used by permanent deletion: an irreversible delete must also be blocked
 * by hidden/draft referrers, which would otherwise dangle if re-published, and
 * by calendar feeds using the item as a default, whose next sync would create
 * events pointing at nothing (editable-permalinks D2).
 */
export async function findReferences(
  type: ContentType,
  slug: string,
  { includeHidden = false }: { includeHidden?: boolean } = {},
): Promise<ContentReference[]> {
  if (type !== "venue" && type !== "organiser") return [];

  // Summaries carry the slugs each item points at, taken from the one table
  // in `references.ts`, so this needs no bodies and no second definition.
  const [events, projects, posts, organisers, feeds] = await Promise.all([
    listSummaries("event"),
    listSummaries("project"),
    listSummaries("blog"),
    listSummaries("organiser"),
    includeHidden ? listFeeds() : Promise.resolve([]),
  ]);

  const refs: ContentReference[] = [];
  const pointing = type === "venue" ? "venues" : "organisers";
  for (const item of [...events, ...projects, ...posts, ...organisers]) {
    if (!includeHidden && item.status !== "published") continue;
    if (!item[pointing].includes(slug)) continue;
    refs.push({
      kind: item.type as ReferrerKind,
      slug: item.slug,
      title: item.title,
      href: item.href,
    });
  }
  for (const f of feeds) {
    if (pointsAt(f as unknown as Record<string, unknown>, "feed", type, slug)) {
      refs.push({ kind: "feed", slug: f.id, title: f.label, href: `/beheer/feeds/${f.id}/bewerken` });
    }
  }

  return refs;
}

export type { ImageReference } from "./image-references";

/**
 * Content that uses the given image URL — as a cover image (any type), in a
 * Venue gallery, or within the body text of any item — so deleting an in-use
 * library image can be blocked and the users reported (editorial-enrichments,
 * body-editor-toolbar D6). Checks every status, so an image used only by a
 * draft is still protected. Compares on the stored URL form, which is the same
 * representation `media.ts` produces for both S3 and local backends.
 */
export async function findImageReferences(url: string): Promise<ImageReference[]> {
  return imageReferencesIn(url, await loadImageUsers());
}

/**
 * Every content item with the images it uses: cover, gallery and body. Bodies
 * are needed for the match, so summaries cannot serve this — it is the one
 * backend read of all content in full, hence the timing line. Wrapped in
 * `cache()` so the gallery asks once for all its images
 * (gallery-find-and-describe D2).
 */
export const loadImageUsers = cache(async (): Promise<ImageUser[]> => {
  const started = performance.now();
  const store = getStore();
  const read = <K extends ContentType>(type: K) =>
    store.readPrefix(CONTENT_PREFIX[type]).then((d) => parseAll(type, d));
  const [events, venues, organisers, posts, projects] = await Promise.all([
    read("event"),
    read("venue"),
    read("organiser"),
    read("blog"),
    read("project"),
  ]);

  const users: ImageUser[] = [
    ...events.map((e) => ({
      kind: "event" as const,
      slug: e.slug,
      title: e.data.title,
      href: routes.event(e.slug),
      cover: e.data.featuredImage,
      body: e.body,
    })),
    ...venues.map((v) => ({
      kind: "venue" as const,
      slug: v.slug,
      title: v.data.name,
      href: routes.venue(v.slug),
      cover: v.data.featuredImage,
      gallery: v.data.images,
      body: v.body,
    })),
    ...organisers.map((o) => ({
      kind: "organiser" as const,
      slug: o.slug,
      title: o.data.name,
      href: routes.organiser(o.slug),
      cover: o.data.featuredImage,
      gallery: organiserGallery(o.data),
      body: o.body,
    })),
    ...posts.map((p) => ({
      kind: "blog" as const,
      slug: p.slug,
      title: p.data.title,
      href: routes.post(p.slug),
      cover: p.data.featuredImage,
      body: p.body,
    })),
    ...projects.map((p) => ({
      kind: "project" as const,
      slug: p.slug,
      title: p.data.title,
      href: routes.project(p.slug),
      cover: p.data.featuredImage,
      body: p.body,
    })),
  ];
  console.info(
    `[content] read ${users.length} documents in full for image use in ${Math.round(performance.now() - started)} ms`,
  );
  return users;
});

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
  const [events, venues, organisers, posts, projects] = await Promise.all([
    listSummaries("event"),
    listSummaries("venue"),
    listSummaries("organiser"),
    listSummaries("blog"),
    listSummaries("project"),
  ]);
  const pending = [...events, ...posts].filter((i) => i.status === "pending").length;
  return {
    events: events.length,
    venues: venues.length,
    organisers: organisers.length,
    posts: posts.length,
    projects: projects.length,
    pending,
  };
}
