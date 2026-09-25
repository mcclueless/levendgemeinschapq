// Relative, not "@/": the schema imports this, and the schema is also loaded by
// the `reindex` CLI.
import { addDays, parseStoredDateTime, siteParts, siteWallTime } from "../lib/date";

/**
 * An event's further dates (event-multiple-dates D1). `start` stays the anchor;
 * `dates` holds the other dates of an irregular series, each with its own time.
 *
 * Pure and clock-free, so the page, the listings and the forms agree on what a
 * date list means without any of them touching the store.
 */

/** A season's worth; bounds what a hand-crafted POST can store (D1). */
export const MAX_EVENT_DATES = 24;

const isValidDate = (d: unknown): d is Date =>
  d instanceof Date && !Number.isNaN(d.getTime());

/**
 * Read a stored list leniently: each value as site time, like `start`, with
 * anything unreadable dropped. Lenient on purpose — `parseAll` skips a document
 * that fails validation, so one bad entry must not remove the whole event.
 */
export function readStoredDates(value: unknown): Date[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(parseStoredDateTime).filter(isValidDate);
}

/**
 * The canonical form of a date list: unreadable values dropped, duplicates and
 * any date equal to `start` dropped, sorted ascending, capped at
 * {@link MAX_EVENT_DATES}. Returns `undefined` for an empty result, so an event
 * without further dates carries no field at all.
 */
export function normaliseDates(
  values: readonly unknown[] | undefined,
  start?: Date,
): Date[] | undefined {
  if (!values?.length) return undefined;
  const seen = new Set<number>(isValidDate(start) ? [start.getTime()] : []);
  const out: Date[] = [];
  for (const d of values.map(parseStoredDateTime)) {
    if (!isValidDate(d) || seen.has(d.getTime())) continue;
    seen.add(d.getTime());
    out.push(d);
  }
  out.sort((a, b) => a.getTime() - b.getTime());
  return out.length ? out.slice(0, MAX_EVENT_DATES) : undefined;
}

/** Every date of an event, `start` included, in chronological order. */
export function allDates(start: Date, dates: readonly Date[] | undefined): Date[] {
  return [start, ...(normaliseDates(dates, start) ?? [])].sort(
    (a, b) => a.getTime() - b.getTime(),
  );
}

/**
 * The end of one occurrence: its start plus the event's own duration (D4), so
 * every date lasts as long as the first. `undefined` when the event has no end,
 * or an end before its start (stored data the form layer now rejects).
 */
export function occurrenceEnd(
  event: { start: Date; end?: Date },
  occurrenceStart: Date,
): Date | undefined {
  if (!event.end) return undefined;
  const duration = event.end.getTime() - event.start.getTime();
  if (duration < 0) return undefined;
  return new Date(occurrenceStart.getTime() + duration);
}

// ── Linking one date (D5) ───────────────────────────────────────────────────

/** The query parameter that selects one date on an event page. */
export const DATE_PARAM = "datum";

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" for the Amsterdam calendar day of `d`. */
export function siteDayKey(d: Date): string {
  const p = siteParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/**
 * A `?datum=` value as the Amsterdam day it names — `[from, until)` — or null
 * when it is not a real calendar date. Never throws: a bad link is not an error.
 */
export function parseDayParam(value: unknown): { from: Date; until: Date } | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const from = siteWallTime(y, mo, d);
  if (siteDayKey(from) !== value) return null; // 2026-02-31 and friends
  return { from, until: addDays(from, 1) };
}

/** An event page URL that opens on the given occurrence's day. */
export function occurrenceHref(eventHref: string, start: Date): string {
  return `${eventHref}?${DATE_PARAM}=${siteDayKey(start)}`;
}

/**
 * Where a listing row for one occurrence should point: that date, for an event
 * with more than one, so clicking "8 nov" opens the 8 November night; the bare
 * page for a single-date event, whose URL needs no qualifier.
 */
export function occurrenceLink(
  event: { href: string; recurrence?: unknown; dates?: readonly Date[] },
  start: Date,
): string {
  return event.recurrence || event.dates?.length
    ? occurrenceHref(event.href, start)
    : event.href;
}
