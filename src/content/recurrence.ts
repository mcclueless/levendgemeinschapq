import type { Recurrence } from "./schema";

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

function addWeeks(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n * 7);
  return copy;
}

function addMonths(d: Date, n: number): Date {
  const copy = new Date(d);
  const targetMonth = copy.getMonth() + n;
  copy.setMonth(targetMonth);
  return copy;
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
      const months =
        (from.getFullYear() - start.getFullYear()) * 12 +
        (from.getMonth() - start.getMonth());
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
 * The next occurrence at or after `from`, or null if the event/recurrence has
 * fully elapsed. A non-recurring event yields its start if it is in range.
 */
export function firstOccurrenceFrom(
  start: Date,
  recurrence: Recurrence | undefined,
  from: Date,
): Date | null {
  if (!recurrence) return start >= from ? start : null;
  const n = firstIndexFrom(start, recurrence, from);
  return n === null ? null : occurrenceAt(start, recurrence, n);
}

/** Back-compat alias: the next occurrence at or after `from`. */
export const nextOccurrence = firstOccurrenceFrom;

/**
 * Return occurrence start dates for an event between `from` and `horizon`.
 * A non-recurring event yields its single start if it falls in range.
 */
export function occurrencesInRange(
  start: Date,
  recurrence: Recurrence | undefined,
  from: Date,
  horizon: Date,
): Date[] {
  if (!recurrence) {
    return start >= from && start <= horizon ? [start] : [];
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
