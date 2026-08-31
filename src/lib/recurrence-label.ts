import { formatDateLong } from "./date";

/**
 * One vocabulary for describing a recurrence (share-event-previews D4).
 *
 * Three surfaces describe the same recurring event — the public event page, the
 * editorial review queue, and event social-sharing metadata. They previously
 * held two separately written labels that disagreed in wording ("Elke week"
 * versus "Wekelijks") and, more seriously, both ignored `interval`: an event
 * repeating every second week was described as repeating every week. Everything
 * that names a recurrence now goes through here.
 *
 * The input is deliberately wider than the stored `Recurrence`: the review queue
 * carries `until` as an ISO string across its server/client boundary, while
 * content carries a `Date`. Accepting both keeps callers from converting at every
 * call site.
 */
export interface RecurrenceLike {
  freq: "weekly" | "monthly";
  /** Absent on older data; a missing interval means every one of `freq`. */
  interval?: number;
  until?: Date | string;
}

/** Plural unit for an interval greater than one. */
const UNITS = {
  weekly: { one: "week", many: "weken" },
  monthly: { one: "maand", many: "maanden" },
} as const;

/**
 * The short interval phrase — "Elke week", "Elke 2 weken", "Elke maand",
 * "Elke 2 maanden" — or `undefined` when the event does not repeat, so callers
 * can omit the segment entirely rather than rendering an empty one.
 */
export function recurrenceLabel(r?: RecurrenceLike): string | undefined {
  if (!r) return undefined;
  const unit = UNITS[r.freq];
  // Guard against a missing, zero, or fractional interval reaching a label:
  // older documents predate the field, and only whole intervals are expressible.
  const n = Math.max(1, Math.trunc(r.interval ?? 1));
  return n === 1 ? `Elke ${unit.one}` : `Elke ${n} ${unit.many}`;
}

/**
 * The fuller phrasing for editorial surfaces, which need the whole proposed
 * series rather than just its interval: a reviewer approving a submission is
 * agreeing to every occurrence it implies. An open-ended recurrence is called
 * out explicitly rather than shown as a bare interval, because imported entries
 * can legitimately have no end date.
 */
export function recurrenceDetail(r?: RecurrenceLike): string {
  if (!r) return "Eenmalig";
  const label = recurrenceLabel(r);
  if (!r.until) return `${label} — zonder einddatum`;
  const until = r.until instanceof Date ? r.until : new Date(r.until);
  // An unparseable stored date must not render "Invalid Date" into the backend.
  if (Number.isNaN(until.getTime())) return `${label} — zonder einddatum`;
  return `${label}, t/m ${formatDateLong(until)}`;
}
