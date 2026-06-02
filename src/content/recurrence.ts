import type { Recurrence } from "./schema";

/**
 * Recurrence expansion (design D5). v1 supports weekly and monthly intervals
 * with an optional end date. We expand only the occurrences needed for
 * "upcoming" listings rather than materializing every event.
 */

const MAX_OCCURRENCES = 60; // safety bound for unbounded (no-`until`) rules

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

  const { freq, interval, until } = recurrence;
  const end = until && until < horizon ? until : horizon;
  const step = (i: number) =>
    freq === "weekly" ? addWeeks(start, i * interval) : addMonths(start, i * interval);

  const out: Date[] = [];
  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    const occ = step(i);
    if (occ > end) break;
    if (occ >= from) out.push(occ);
  }
  return out;
}

/**
 * The next occurrence at or after `from`, or null if the event/recurrence has
 * fully elapsed.
 */
export function nextOccurrence(
  start: Date,
  recurrence: Recurrence | undefined,
  from: Date,
): Date | null {
  if (!recurrence) return start >= from ? start : null;

  const { freq, interval, until } = recurrence;
  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    const occ =
      freq === "weekly" ? addWeeks(start, i * interval) : addMonths(start, i * interval);
    if (until && occ > until) return null;
    if (occ >= from) return occ;
  }
  return null;
}
