import type { Recurrence } from "./schema";
import { occurrencesInRange } from "./recurrence";
import { occurrenceEnd } from "./event-dates";
import { addDays, siteParts, siteWallTime } from "@/lib/date";

/**
 * Which occurrences of an event a listing gets (event-recurring-next-only D2).
 *
 * A recurring event can be set to stand in listings for its next occurrence
 * alone, instead of filling the agenda with thirteen copies of itself. The rule
 * lives here, between the pure expansion in `recurrence.ts` and the single
 * listing funnel `getUpcomingEvents`, so that:
 *
 *  - `occurrencesInRange` keeps returning the whole series, which is what
 *    leaves the event page, its `?datum=` links, its share metadata, its
 *    structured data and the iCal importer untouched — none of them come
 *    through here;
 *  - the three listing components can ask the same question (`showsNextOnly`)
 *    that produced the selection, rather than trusting a second field that
 *    could disagree with it.
 *
 * Pure and clock-injected, like `presentOccurrence`, so the selection is
 * testable without touching the clock.
 */

export interface SeriesEvent {
  start: Date;
  end?: Date;
  recurrence?: Recurrence;
  dates?: readonly Date[];
  /** An agenda marker is about a day, not a time (event-no-page D3). */
  noPage?: boolean;
  nextOccurrenceOnly?: boolean;
}

/**
 * Whether this event stands in listings for its next occurrence alone.
 *
 * Derived from the two stored fields rather than read from one, because the
 * flag means nothing without a rule (D1): the schema deliberately carries no
 * cross-field rule, so a flag that arrives without a recurrence — from a
 * hand-edited file, or a future writer that sets it too early — is dead here
 * rather than dangerous. An event that names its dates is therefore unaffected,
 * since it has no recurrence for the flag to pair with.
 */
export function showsNextOnly(event: SeriesEvent): boolean {
  return Boolean(event.nextOccurrenceOnly && event.recurrence);
}

/** The first instant of the day after `d`, in the site timezone. */
function endOfSiteDay(d: Date): Date {
  const p = siteParts(d);
  return addDays(siteWallTime(p.year, p.month, p.day), 1);
}

/**
 * When one occurrence stops being the current one (D3):
 *
 *  - an occurrence with an end passes at that end, so an event that is under
 *    way keeps its listing entry;
 *  - an agenda marker passes at the end of its day — its start is midnight, so
 *    passing at its start would make a recurring marker vanish before the day
 *    it marks (event-no-page D3);
 *  - anything else passes at its own start, which is the "once the hour has
 *    passed" the change asked for. An editor who wants the entry to hold
 *    through the session gives the event an end time.
 */
export function occurrencePassedAt(event: SeriesEvent, start: Date): Date {
  return occurrenceEnd(event, start) ?? (event.noPage ? endOfSiteDay(start) : start);
}

/**
 * The occurrence dates a listing should show for this event, soonest first.
 *
 * For an event standing in for its next occurrence: the first occurrence in
 * range that has not passed at `now`, as a one-element list, or an empty list
 * when the series has nothing left — which is how such an event leaves the
 * listings once its recurrence end date is behind it, exactly as any event does
 * when its dates are.
 *
 * For every other event — no flag, no recurrence, or a date series — exactly
 * what `occurrencesInRange` returns, unchanged.
 */
export function listedOccurrences(
  event: SeriesEvent,
  from: Date,
  horizon: Date,
  now: Date,
): Date[] {
  const all = occurrencesInRange(
    event.start,
    event.recurrence,
    from,
    horizon,
    event.dates,
  );
  if (!showsNextOnly(event)) return all;
  const next = all.find((start) => occurrencePassedAt(event, start) > now);
  return next ? [next] : [];
}
