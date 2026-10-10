import "server-only";
import { getAllEvents } from "./repository";
import { listedOccurrences } from "./event-series";
import { occurrenceEnd } from "./event-dates";
import { isOrganisedBy } from "./event-organisers";
import { addDays, startOfToday } from "@/lib/date";
import type { EventOccurrence } from "./types";

export interface UpcomingQuery {
  /** Max occurrences to return. Omit for all. */
  limit?: number;
  /** Restrict to a venue slug. */
  venueSlug?: string;
  /** Restrict to an organiser slug. */
  organiserSlug?: string;
  /** How far into the future to look (days). Default 365. */
  horizonDays?: number;
  /**
   * The clock, for deciding whether a collapsed series' occurrence has passed
   * (event-recurring-next-only D2). Injected so the selection is testable; the
   * listing pages are `force-dynamic`, so reading it per request is free.
   */
  now?: Date;
}

export interface UpcomingResult {
  occurrences: EventOccurrence[];
  /** Total upcoming occurrences before any limit was applied. */
  total: number;
  /** Whether more exist beyond the returned slice (drives "See more…"). */
  hasMore: boolean;
}

/**
 * Upcoming-events query (events spec): occurrences today or in the future,
 * ordered soonest first, with an optional cap. Recurring events and date series
 * contribute one occurrence per future date within the horizon, each carrying
 * its own end (event-multiple-dates D4) — except a recurring event set to stand
 * for its next occurrence alone, which contributes exactly one
 * (event-recurring-next-only D2).
 *
 * The collapse happens here, before the sort, so such an entry takes its place
 * among the others by its own date rather than being pinned anywhere, and
 * `total` and `hasMore` count entries as a visitor sees them.
 */
export async function getUpcomingEvents(
  query: UpcomingQuery = {},
): Promise<UpcomingResult> {
  const { limit, venueSlug, organiserSlug, horizonDays = 365, now = new Date() } = query;
  const from = startOfToday(now);
  const horizon = addDays(from, horizonDays);

  const events = await getAllEvents();
  const occurrences: EventOccurrence[] = [];

  for (const event of events) {
    if (venueSlug && event.venue?.slug !== venueSlug) continue;
    if (organiserSlug && !isOrganisedBy(event, organiserSlug)) continue;
    for (const start of listedOccurrences(event, from, horizon, now)) {
      occurrences.push({ event, start, end: occurrenceEnd(event, start) });
    }
  }

  occurrences.sort((a, b) => a.start.getTime() - b.start.getTime());

  const total = occurrences.length;
  const sliced = typeof limit === "number" ? occurrences.slice(0, limit) : occurrences;
  return { occurrences: sliced, total, hasMore: total > sliced.length };
}
