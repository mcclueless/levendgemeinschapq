import "server-only";
import { CONTENT_PREFIX, getStore } from "./storage";
import { parseAll } from "./parse";

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

/** Counts for the dashboard. */
export async function getContentCounts() {
  const store = getStore();
  const [events, venues, organisers, posts] = await Promise.all([
    store.readPrefix(CONTENT_PREFIX.event).then((d) => parseAll("event", d)),
    store.readPrefix(CONTENT_PREFIX.venue).then((d) => parseAll("venue", d)),
    store.readPrefix(CONTENT_PREFIX.organiser).then((d) => parseAll("organiser", d)),
    store.readPrefix(CONTENT_PREFIX.blog).then((d) => parseAll("blog", d)),
  ]);
  const pending =
    events.filter((e) => e.data.status === "pending").length +
    posts.filter((p) => p.data.status === "pending").length;
  return {
    events: events.length,
    venues: venues.length,
    organisers: organisers.length,
    posts: posts.length,
    pending,
  };
}
