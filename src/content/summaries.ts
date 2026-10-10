import { cache } from "react";
import { CONTENT_PREFIX, getStore } from "./storage";
import { parseAll, type ParsedDoc } from "./parse";
import type { ContentType, PublishStatus, Recurrence } from "./schema";
import { normaliseDates } from "./event-dates";
import { referencedSlugs, type ReferrerKind } from "./references";
import { routes } from "@/lib/routes";

/**
 * Content summaries (admin-content-table D2): what a list or a reference check
 * needs to know about an item, without its body. Every backend list, count and
 * hide/delete check reads these through `listSummaries`, so that a faster
 * source than reading every document has one place to go.
 */
export interface ContentSummary {
  type: ContentType;
  slug: string;
  /** Title for events, blog posts and projects; name for venues and organisers. */
  title: string;
  status: PublishStatus;
  /** Public URL of the item. */
  href: string;
  /** When the store last wrote the document; absent if the store cannot tell. */
  modified?: Date;
  /** The venue slugs the item points at, as `references.ts` defines them. */
  venues: string[];
  /** The organiser slugs the item points at. */
  organisers: string[];
  // Events
  start?: Date;
  end?: Date;
  recurrence?: Recurrence;
  /** Further dates beyond `start`, normalised; absent when there are none. */
  dates?: Date[];
  noPage?: boolean;
  /** An event that leads to an external page (event-external-link D1). */
  externalUrl?: string;
  /** Blog posts and projects. */
  date?: Date;
  /** Blog posts. */
  author?: string;
  /** Venues. */
  address?: string;
}

const PUBLIC_PATH: Record<ContentType, (slug: string) => string> = {
  event: routes.event,
  venue: routes.venue,
  organiser: routes.organiser,
  blog: routes.post,
  project: routes.project,
};

/** Venues point at nothing; every other type is a referrer kind of its own name. */
const REFERRER_KIND: Partial<Record<ContentType, ReferrerKind>> = {
  event: "event",
  organiser: "organiser",
  blog: "blog",
  project: "project",
};

/** The summary of one parsed document. Pure, so it is testable without a store. */
export function toSummary(
  type: ContentType,
  doc: ParsedDoc<object>,
  modified?: Date,
): ContentSummary {
  const data = doc.data as Record<string, unknown>;
  const kind = REFERRER_KIND[type];
  const start = type === "event" ? (data.start as Date) : undefined;
  return {
    type,
    slug: doc.slug,
    title: (data.title ?? data.name ?? doc.slug) as string,
    status: data.status as PublishStatus,
    href: PUBLIC_PATH[type](doc.slug),
    modified,
    venues: kind ? referencedSlugs(data, kind, "venue") : [],
    organisers: kind ? referencedSlugs(data, kind, "organiser") : [],
    ...(type === "event"
      ? {
          start,
          end: data.end as Date | undefined,
          recurrence: data.recurrence as Recurrence | undefined,
          dates: normaliseDates(data.dates as Date[] | undefined, start),
          noPage: data.noPage === true,
          externalUrl: data.externalUrl as string | undefined,
        }
      : {}),
    ...(type === "blog" || type === "project" ? { date: data.date as Date } : {}),
    ...(type === "blog" ? { author: data.author as string } : {}),
    ...(type === "venue" ? { address: data.address as string | undefined } : {}),
  };
}

/**
 * Every item of a type, of any status, in no particular order. Wrapped in
 * `cache()` so one request reads a type once however many callers ask.
 *
 * Logs how long the read took: nothing is cached between requests, so these
 * lines are how we see when reading every document stops being cheap (D2).
 */
export const listSummaries = cache(
  async (type: ContentType): Promise<ContentSummary[]> => {
    const started = performance.now();
    const stored = await getStore().readPrefix(CONTENT_PREFIX[type]);
    const modified = new Map(stored.map((d) => [d.key, d.modified]));
    const summaries = parseAll(type, stored).map((doc) =>
      toSummary(type, doc, modified.get(doc.key)),
    );
    console.info(
      `[content] read ${stored.length} ${type} documents in ${Math.round(performance.now() - started)} ms`,
    );
    return summaries;
  },
);
