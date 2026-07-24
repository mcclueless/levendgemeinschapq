import type { Recurrence } from "./schema";

/**
 * Map an iCal RRULE (as node-ical exposes it) to the site's Recurrence, or
 * `undefined` when the rule is not an interval we can expand (design: weekly and
 * monthly only in v1).
 *
 * Pure and free of `server-only` deps on purpose, so it can be unit-tested
 * against real node-ical output — the mapping is version-sensitive and was
 * silently broken once already (see {@link freqName}).
 */

/**
 * node-ical 0.26.x exposes `rrule.options.freq` as a string ("WEEKLY",
 * "MONTHLY", "DAILY", …) via its RRuleCompatWrapper — NOT the numeric rrule
 * constant an older node-ical returned. We accept either form so the mapping is
 * robust across node-ical versions; the earlier numeric-only check (`=== 2`)
 * matched nothing here and imported every recurrence as a one-off.
 */
export function freqName(freq: unknown): string {
  const NUMERIC: Record<number, string> = {
    0: "YEARLY",
    1: "MONTHLY",
    2: "WEEKLY",
    3: "DAILY",
  };
  if (typeof freq === "number") return NUMERIC[freq] ?? "";
  return typeof freq === "string" ? freq.toUpperCase() : "";
}

export function mapRecurrence(rrule?: {
  options?: { freq?: unknown; interval?: number; until?: Date };
}): Recurrence | undefined {
  const opts = rrule?.options;
  if (!opts) return undefined;
  const freq = freqName(opts.freq);
  if (freq === "WEEKLY")
    return { freq: "weekly", interval: opts.interval ?? 1, until: opts.until };
  if (freq === "MONTHLY")
    return { freq: "monthly", interval: opts.interval ?? 1, until: opts.until };
  return undefined; // daily/yearly not expandable in v1
}
