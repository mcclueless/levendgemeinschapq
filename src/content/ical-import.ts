import ical from "node-ical";
import { CONTENT_PREFIX, getStore } from "./storage";
import { parseAll } from "./parse";
import { createDocument, slugify } from "./write";

/**
 * Calendar import (calendar-import spec). Fetches a Google Calendar / iCal feed,
 * maps VEVENTs to Events, interprets RRULE recurrence, de-duplicates by UID, and
 * writes results as `pending` for admin review. Unmatched venues are flagged.
 */

export interface ImportDefaults {
  /** Organiser slug applied to all imported events. */
  defaultOrganiser: string;
  /** Venue slug used when a VEVENT location doesn't match a known venue. */
  defaultVenue: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  flagged: number;
  errors: string[];
}

/** Minimal shape of a VEVENT entry we read from node-ical. */
interface VEventLike {
  type?: string;
  uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: Date;
  end?: Date;
  rrule?: { options?: { freq?: number; interval?: number; until?: Date } };
}

// rrule freq constants (from the rrule library used by node-ical).
const FREQ_WEEKLY = 2;
const FREQ_MONTHLY = 1;

function mapRecurrence(rrule?: {
  options?: { freq?: number; interval?: number; until?: Date };
}) {
  const opts = rrule?.options;
  if (!opts) return undefined;
  if (opts.freq === FREQ_WEEKLY)
    return { freq: "weekly", interval: opts.interval ?? 1, until: opts.until };
  if (opts.freq === FREQ_MONTHLY)
    return { freq: "monthly", interval: opts.interval ?? 1, until: opts.until };
  return undefined; // daily/yearly not supported in v1
}

export async function importFromUrl(
  url: string,
  defaults: ImportDefaults,
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, skipped: 0, flagged: 0, errors: [] };

  let feed: Awaited<ReturnType<typeof ical.async.fromURL>>;
  try {
    feed = await ical.async.fromURL(url);
  } catch (err) {
    result.errors.push(`Kon de agenda niet ophalen: ${(err as Error).message}`);
    return result;
  }

  // Existing UIDs and venue slugs for de-dup / matching.
  const store = getStore();
  const [events, venues] = await Promise.all([
    store.readPrefix(CONTENT_PREFIX.event).then((d) => parseAll("event", d)),
    store.readPrefix(CONTENT_PREFIX.venue).then((d) => parseAll("venue", d)),
  ]);
  const existingUids = new Set(events.map((e) => e.data.uid).filter(Boolean));
  const venueSlugs = new Set(venues.map((v) => v.slug));

  for (const raw of Object.values(feed)) {
    const item = raw as VEventLike;
    if (item.type !== "VEVENT" || !item.start) continue;

    const uid = item.uid ?? `${slugify(item.summary ?? "event")}-${item.start.toISOString()}`;
    if (existingUids.has(uid)) {
      result.skipped++;
      continue;
    }

    // Match location to a known venue, else fall back and flag for review.
    const locationSlug = item.location ? slugify(item.location) : "";
    const matchedVenue = venueSlugs.has(locationSlug) ? locationSlug : null;
    const venue = matchedVenue ?? defaults.defaultVenue;
    const flagged = !matchedVenue;

    const recurrence = mapRecurrence(item.rrule);

    try {
      await createDocument(
        "event",
        item.summary ?? "Geïmporteerd evenement",
        {
          title: item.summary ?? "Geïmporteerd evenement",
          start: item.start.toISOString(),
          end: item.end ? item.end.toISOString() : undefined,
          venue,
          organiser: defaults.defaultOrganiser,
          excerpt: item.description?.slice(0, 200),
          uid,
          recurrence,
          status: "pending",
          submittedBy: "Agenda-import",
          submittedAt: new Date().toISOString(),
          reviewNote: flagged
            ? `Locatie "${item.location ?? "onbekend"}" kon niet automatisch worden gekoppeld — controleer de locatie.`
            : undefined,
        },
        item.description ?? "",
      );
      existingUids.add(uid);
      result.created++;
      if (flagged) result.flagged++;
    } catch (err) {
      result.errors.push(
        `Kon "${item.summary}" niet importeren: ${(err as Error).message}`,
      );
    }
  }

  return result;
}
