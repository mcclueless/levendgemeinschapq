import { formatDateLong, formatDayMonth, formatTime, formatWeekdayShort } from "./date";

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

/**
 * The rhythm of a recurring event, as a listing entry states it
 * (event-recurring-next-only D4): "Elke week vr. om 16:30".
 *
 * Built on {@link recurrenceLabel}, so the interval is never dropped — every
 * second week reads "Elke 2 weken vr. om 16:30", which the events spec requires
 * of every description of a recurrence. A weekly rhythm names its weekday,
 * because that is what makes it recognisable; a monthly one does not, because
 * the next-date line beside it states the day of the month exactly.
 *
 * `undefined` when the event does not repeat, so a caller can omit the line
 * rather than render an empty one.
 */
export function recurrenceSummary(
  r: RecurrenceLike | undefined,
  next: Date,
): string | undefined {
  const rhythm = recurrenceRhythm(r, next);
  return rhythm ? `${rhythm} om ${formatTime(next)}` : undefined;
}

/**
 * The same rhythm without its time — "Elke week vr.", "Elke maand" — for the
 * table view, whose Tijd column states the time in its own right (D5). Split
 * out so the two surfaces cannot word the rhythm differently, which is the
 * whole reason this module exists.
 */
export function recurrenceRhythm(
  r: RecurrenceLike | undefined,
  next: Date,
): string | undefined {
  if (!r) return undefined;
  const label = recurrenceLabel(r);
  return r.freq === "weekly" ? `${label} ${formatWeekdayShort(next)}.` : label;
}

/**
 * The date a collapsed series next happens, as its listing entry states it:
 * "Volgende 16 okt". Without the weekday, which the rhythm line already named.
 */
export function nextDateLabel(next: Date): string {
  return `Volgende ${formatDayMonth(next)}`;
}
