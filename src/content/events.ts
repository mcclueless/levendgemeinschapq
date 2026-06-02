import "server-only";
import { getAllEvents } from "./repository";
import { occurrencesInRange } from "./recurrence";
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
 * ordered soonest first, with an optional cap. Recurring events contribute one
 * occurrence per future date within the horizon.
 */
export async function getUpcomingEvents(
  query: UpcomingQuery = {},
): Promise<UpcomingResult> {
  const { limit, venueSlug, organiserSlug, horizonDays = 365 } = query;
  const from = startOfToday();
  const horizon = addDays(from, horizonDays);

  const events = await getAllEvents();
  const occurrences: EventOccurrence[] = [];

  for (const event of events) {
    if (venueSlug && event.venue?.slug !== venueSlug) continue;
    if (organiserSlug && event.organiser?.slug !== organiserSlug) continue;
    for (const start of occurrencesInRange(
      event.start,
      event.recurrence,
      from,
      horizon,
    )) {
      occurrences.push({ event, start });
    }
  }

  occurrences.sort((a, b) => a.start.getTime() - b.start.getTime());

  const total = occurrences.length;
  const sliced = typeof limit === "number" ? occurrences.slice(0, limit) : occurrences;
  return { occurrences: sliced, total, hasMore: total > sliced.length };
}
