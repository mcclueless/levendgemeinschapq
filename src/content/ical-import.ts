import ical from "node-ical";
import { CONTENT_PREFIX, getStore } from "./storage";
import { parseAll } from "./parse";
import { createDocument, patchFrontmatter, setStatus, slugify } from "./write";
import type { Feed } from "./feeds";

/**
 * Calendar sync (calendar-import spec). Fetches a saved feed, maps VEVENTs to
 * Events, interprets RRULE recurrence, de-duplicates by UID, and writes results
 * as `pending` for admin review. Unmatched venues are flagged.
 *
 * Semantics are **Copy**, not Mirror (design D3): an entry already on the site
 * is skipped and never overwritten, so editorial work done after import — a
 * corrected venue, a rewritten description, a chosen cover — is never destroyed
 * by a sync.
 *
 * The one thing a sync does change about existing events is hiding those the
 * feed no longer lists, under four guards (design D4). See {@link syncFeed}.
 *
 * No request-scoped dependencies: a scheduled caller could be added later
 * without restructuring anything here (design D2).
 */

export interface SyncResult {
  created: number;
  skipped: number;
  /** Events hidden because the feed no longer lists them. */
  hidden: number;
  /** Created events whose venue could not be matched automatically. */
  flagged: number;
  /** Pre-existing imports newly linked to this feed. */
  adopted: number;
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

function uidFor(item: VEventLike): string {
  return (
    item.uid ?? `${slugify(item.summary ?? "event")}-${item.start!.toISOString()}`
  );
}

/**
 * Fetch a saved feed and reconcile it against the site.
 *
 * Creates entries new to the site, skips those already present, adopts
 * pre-existing imports into this feed, and hides events the feed has dropped.
 */
export async function syncFeed(feed: Feed): Promise<SyncResult> {
  const result: SyncResult = {
    created: 0,
    skipped: 0,
    hidden: 0,
    flagged: 0,
    adopted: 0,
    errors: [],
  };

  let raw: Awaited<ReturnType<typeof ical.async.fromURL>>;
  try {
    raw = await ical.async.fromURL(feed.url);
  } catch (err) {
    result.errors.push(`Kon de agenda niet ophalen: ${(err as Error).message}`);
    return result;
  }

  const entries = Object.values(raw)
    .map((r) => r as VEventLike)
    .filter((i) => i.type === "VEVENT" && i.start);

  const store = getStore();
  const [events, venues] = await Promise.all([
    store.readPrefix(CONTENT_PREFIX.event).then((d) => parseAll("event", d)),
    store.readPrefix(CONTENT_PREFIX.venue).then((d) => parseAll("venue", d)),
  ]);
  const bySavedUid = new Map(
    events.filter((e) => e.data.uid).map((e) => [e.data.uid as string, e]),
  );
  const venueSlugs = new Set(venues.map((v) => v.slug));
  const feedUids = new Set(entries.map(uidFor));

  for (const item of entries) {
    const uid = uidFor(item);
    const existing = bySavedUid.get(uid);

    if (existing) {
      result.skipped++;
      // Adoption: link a pre-existing import to this feed so it can take part
      // in cancellation-hiding. Writes `feedId` and NOTHING else — a broader
      // write here would be an update path through the back door, violating
      // Copy semantics (design D5).
      if (!existing.data.feedId) {
        try {
          await patchFrontmatter("event", existing.slug, { feedId: feed.id });
          result.adopted++;
        } catch (err) {
          result.errors.push(
            `Kon "${existing.data.title}" niet aan de agenda koppelen: ${(err as Error).message}`,
          );
        }
      }
      continue;
    }

    // Match location to a known venue, else fall back and flag for review.
    const locationSlug = item.location ? slugify(item.location) : "";
    const matchedVenue = venueSlugs.has(locationSlug) ? locationSlug : null;
    const venue = matchedVenue ?? feed.defaultVenue;
    const flagged = !matchedVenue;

    try {
      await createDocument(
        "event",
        item.summary ?? "Geïmporteerd evenement",
        {
          title: item.summary ?? "Geïmporteerd evenement",
          start: item.start!.toISOString(),
          end: item.end ? item.end.toISOString() : undefined,
          venue,
          organiser: feed.defaultOrganiser,
          excerpt: item.description?.slice(0, 200),
          uid,
          feedId: feed.id,
          recurrence: mapRecurrence(item.rrule),
          status: "pending",
          submittedBy: `Agenda-import (${feed.label})`,
          submittedAt: new Date().toISOString(),
          reviewNote: flagged
            ? `Locatie "${item.location ?? "onbekend"}" kon niet automatisch worden gekoppeld — controleer de locatie.`
            : undefined,
        },
        item.description ?? "",
      );
      result.created++;
      if (flagged) result.flagged++;
    } catch (err) {
      result.errors.push(
        `Kon "${item.summary}" niet importeren: ${(err as Error).message}`,
      );
    }
  }

  result.hidden = await hideCancelled(feed, feedUids, events, result);
  return result;
}

/**
 * Hide events this feed produced that it no longer lists (design D4).
 *
 * Four guards, each covering a way the naive rule destroys data:
 *
 *  1. **Only this feed's events.** Never hand-made events, never another
 *     feed's, even on a UID collision.
 *  2. **Only future events.** Feeds commonly publish a rolling window and drop
 *     past entries; without this, one sync would "cancel" the site's history.
 *  3. **Only a non-empty fetch.** Zero entries technically means "everything
 *     was cancelled" and almost always means a rotated URL or an auth failure.
 *  4. **Hide, never delete.** Reversible from the backend; permanent deletion
 *     stays a deliberate admin action.
 */
async function hideCancelled(
  feed: Feed,
  feedUids: Set<string>,
  events: Awaited<ReturnType<typeof parseAll<"event">>>,
  result: SyncResult,
): Promise<number> {
  // Guard 3: an empty feed is far more likely broken than genuinely emptied.
  if (feedUids.size === 0) return 0;

  const now = new Date();
  let hidden = 0;

  for (const e of events) {
    if (e.data.feedId !== feed.id) continue; // guard 1
    if (!e.data.uid || feedUids.has(e.data.uid)) continue;
    if (e.data.start <= now) continue; // guard 2
    if (e.data.status === "draft") continue; // already hidden

    try {
      await setStatus("event", e.slug, "draft", {
        reviewNote: `Niet meer aanwezig in de agenda "${feed.label}" — automatisch verborgen bij het synchroniseren.`,
      });
      hidden++;
    } catch (err) {
      result.errors.push(
        `Kon "${e.data.title}" niet verbergen: ${(err as Error).message}`,
      );
    }
  }
  return hidden;
}
