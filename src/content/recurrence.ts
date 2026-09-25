import type { Recurrence } from "./schema";
import { addDays, addMonths, siteParts } from "@/lib/date";

/**
 * Recurrence expansion (design D5). v1 supports weekly and monthly intervals
 * with an optional end date. We expand only the occurrences needed for
 * "upcoming" listings rather than materializing every event.
 *
 * The forward scan skips straight to the first occurrence at or after `from`
 * arithmetically (import-current-and-future-events D2/D5), so an open-ended
 * recurrence whose start is long in the past still surfaces its next occurrence
 * — the previous step-from-start scan silently stopped presenting occurrences
 * once the start was more than `MAX_OCCURRENCES` intervals old. Occurrences are
 * still generated from `start` by index (never compounded from the previous
 * occurrence), so a month-end anchor does not drift.
 */

const MAX_OCCURRENCES = 60; // safety bound on how many occurrences we emit

const DAY_MS = 24 * 60 * 60 * 1000;

// Calendar arithmetic in the site timezone, so an occurrence keeps its local
// time across DST whatever the server's timezone.
function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

/** The occurrence at recurrence index `i` (0 = the start itself). */
function occurrenceAt(start: Date, recurrence: Recurrence, i: number): Date {
  const { freq, interval } = recurrence;
  return freq === "weekly"
    ? addWeeks(start, i * interval)
    : addMonths(start, i * interval);
}

/**
 * Index of the first occurrence at or after `from`, or `null` when the series
 * has fully elapsed (its `until` is before `from`). Estimates the index
 * arithmetically and corrects by at most a step or two, so it is not bounded by
 * how long ago the recurrence started.
 */
function firstIndexFrom(
  start: Date,
  recurrence: Recurrence,
  from: Date,
): number | null {
  const { freq, interval, until } = recurrence;
  if (until && until < from) return null;

  let n = 0;
  if (start < from) {
    if (freq === "weekly") {
      n = Math.max(
        0,
        Math.floor((from.getTime() - start.getTime()) / (7 * DAY_MS * interval)),
      );
    } else {
      const [f, st] = [siteParts(from), siteParts(start)];
      const months = (f.year - st.year) * 12 + (f.month - st.month);
      n = Math.max(0, Math.floor(months / interval));
    }
    // Correct a possible over/undershoot from the estimate (O(1) iterations).
    while (n > 0 && occurrenceAt(start, recurrence, n - 1) >= from) n--;
    while (occurrenceAt(start, recurrence, n) < from) n++;
  }

  if (until && occurrenceAt(start, recurrence, n) > until) return null;
  return n;
}

/**
 * An event's own dates when it does not recur: its start plus any further dates
 * (event-multiple-dates D3), sorted and without duplicates.
 */
function listedDates(start: Date, dates: readonly Date[] | undefined): Date[] {
  if (!dates?.length) return [start];
  const byTime = new Map<number, Date>([[start.getTime(), start]]);
  for (const d of dates) byTime.set(d.getTime(), d);
  return [...byTime.values()].sort((a, b) => a.getTime() - b.getTime());
}

/**
 * The next occurrence at or after `from`, or null if the event/recurrence has
 * fully elapsed. A non-recurring event yields the first of its start and its
 * further `dates` that is in range. With a recurrence, `dates` is ignored: an
 * event repeats on a rule or names its dates, never both (event-multiple-dates
 * D2), so behaviour is defined rather than merged if both are stored.
 */
export function firstOccurrenceFrom(
  start: Date,
  recurrence: Recurrence | undefined,
  from: Date,
  dates?: readonly Date[],
): Date | null {
  if (!recurrence) return listedDates(start, dates).find((d) => d >= from) ?? null;
  const n = firstIndexFrom(start, recurrence, from);
  return n === null ? null : occurrenceAt(start, recurrence, n);
}

/** Back-compat alias: the next occurrence at or after `from`. */
export const nextOccurrence = firstOccurrenceFrom;

/**
 * Return occurrence start dates for an event between `from` and `horizon`,
 * soonest first. A non-recurring event yields each of its start and its further
 * `dates` that falls in range; with a recurrence, `dates` is ignored (D2).
 */
export function occurrencesInRange(
  start: Date,
  recurrence: Recurrence | undefined,
  from: Date,
  horizon: Date,
  dates?: readonly Date[],
): Date[] {
  if (!recurrence) {
    return listedDates(start, dates).filter((d) => d >= from && d <= horizon);
  }

  const { until } = recurrence;
  const end = until && until < horizon ? until : horizon;

  const n0 = firstIndexFrom(start, recurrence, from);
  if (n0 === null) return [];

  const out: Date[] = [];
  for (let i = n0; i < n0 + MAX_OCCURRENCES; i++) {
    const occ = occurrenceAt(start, recurrence, i);
    if (occ > end) break;
    out.push(occ); // occ >= from is guaranteed for i >= n0
  }
  return out;
}
