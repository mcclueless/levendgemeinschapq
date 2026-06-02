import { cache } from "react";
import "server-only";
import { CONTENT_PREFIX, getStore } from "./storage";
import { parseAll } from "./parse";
import { routes } from "@/lib/routes";
import type { BlogPost, CalendarEvent, Organiser, Venue } from "./types";

/**
 * Content repository (design D3). Loads MD/MDX from the store, validates it,
 * resolves venue/organiser references, and exposes typed getters. Loading is
 * wrapped in React `cache()` so a single request reads the store once.
 */

const isPublished = <T extends { status: string }>(x: T) =>
  x.status === "published";

const loadVenues = cache(async (): Promise<Map<string, Venue>> => {
  const docs = parseAll("venue", await getStore().readPrefix(CONTENT_PREFIX.venue));
  const map = new Map<string, Venue>();
  for (const d of docs) {
    map.set(d.slug, {
      slug: d.slug,
      name: d.data.name,
      phone: d.data.phone,
      email: d.data.email,
      website: d.data.website,
      address: d.data.address,
      lat: d.data.lat,
      lng: d.data.lng,
      images: d.data.images,
      excerpt: d.data.excerpt,
      status: d.data.status,
      body: d.body,
      href: routes.venue(d.slug),
    });
  }
  return map;
});

const loadOrganisers = cache(async (): Promise<Map<string, Organiser>> => {
  const docs = parseAll(
    "organiser",
    await getStore().readPrefix(CONTENT_PREFIX.organiser),
  );
  const map = new Map<string, Organiser>();
  for (const d of docs) {
    map.set(d.slug, {
      slug: d.slug,
      name: d.data.name,
      phone: d.data.phone,
      email: d.data.email,
      website: d.data.website,
      portfolio: d.data.portfolio,
      excerpt: d.data.excerpt,
      status: d.data.status,
      body: d.body,
      href: routes.organiser(d.slug),
    });
  }
  return map;
});

const loadEvents = cache(async (): Promise<CalendarEvent[]> => {
  const [docs, venues, organisers] = await Promise.all([
    getStore()
      .readPrefix(CONTENT_PREFIX.event)
      .then((d) => parseAll("event", d)),
    loadVenues(),
    loadOrganisers(),
  ]);
  return docs.map((d) => ({
    slug: d.slug,
    title: d.data.title,
    start: d.data.start,
    end: d.data.end,
    venue: venues.get(d.data.venue) ?? null,
    organiser: organisers.get(d.data.organiser) ?? null,
    featuredImage: d.data.featuredImage,
    excerpt: d.data.excerpt,
    recurrence: d.data.recurrence,
    uid: d.data.uid,
    status: d.data.status,
    body: d.body,
    href: routes.event(d.slug),
  }));
});

const loadPosts = cache(async (): Promise<BlogPost[]> => {
  const [docs, venues, organisers] = await Promise.all([
    getStore()
      .readPrefix(CONTENT_PREFIX.blog)
      .then((d) => parseAll("blog", d)),
    loadVenues(),
    loadOrganisers(),
  ]);
  const resolve = <T>(slugs: string[], map: Map<string, T>) =>
    slugs.map((s) => map.get(s)).filter((x): x is T => x != null);

  return docs.map((d) => ({
    slug: d.slug,
    title: d.data.title,
    date: d.data.date,
    author: d.data.author,
    featuredImage: d.data.featuredImage,
    excerpt: d.data.excerpt,
    relatedVenues: resolve(d.data.relatedVenues, venues),
    relatedOrganisers: resolve(d.data.relatedOrganisers, organisers),
    status: d.data.status,
    body: d.body,
    href: routes.post(d.slug),
  }));
});

// ── Public getters (published-only for the public site) ─────────────────────

export async function getVenues(): Promise<Venue[]> {
  return [...(await loadVenues()).values()]
    .filter(isPublished)
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export async function getVenue(slug: string): Promise<Venue | null> {
  const v = (await loadVenues()).get(slug);
  return v && isPublished(v) ? v : null;
}

export async function getOrganisers(): Promise<Organiser[]> {
  return [...(await loadOrganisers()).values()]
    .filter(isPublished)
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export async function getOrganiser(slug: string): Promise<Organiser | null> {
  const o = (await loadOrganisers()).get(slug);
  return o && isPublished(o) ? o : null;
}

export async function getAllEvents(): Promise<CalendarEvent[]> {
  return (await loadEvents()).filter(isPublished);
}

export async function getEvent(slug: string): Promise<CalendarEvent | null> {
  const e = (await loadEvents()).find((ev) => ev.slug === slug);
  return e && isPublished(e) ? e : null;
}

/** Published blog posts in reverse-chronological order (blog spec). */
export async function getBlogPosts(): Promise<BlogPost[]> {
  return (await loadPosts())
    .filter(isPublished)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const p = (await loadPosts()).find((post) => post.slug === slug);
  return p && isPublished(p) ? p : null;
}
