import { MAX_EVENT_DATES, normaliseDates } from "./event-dates";
import { siteInputToIso, toSiteInputValue } from "@/lib/date";

/**
 * Event timing validation shared by the editorial backend and the public
 * submission form (docs/bugs/event-end-before-start-unvalidated.md).
 *
 * Nothing previously checked that an occurrence's `end` was at or after its
 * `start`, on any of the three forms. The recurrence end date *is* validated
 * against `start` (`recurrence-form.ts`); the occurrence's own pair never got
 * the same treatment.
 *
 * Deliberately NOT enforced in `EventFrontmatter`: two already-stored events
 * have an end preceding their start, and `parseAll` skips documents that fail
 * validation — so a schema-level rule would delete them from the public site
 * and the backend list with no visible error. Same reasoning as the recurrence
 * change's design D2. Form layer only; existing documents keep working until
 * someone next edits them.
 */

export type EventRangeResult = { ok: true } | { ok: false; reason: "range-end-before-start" };

/**
 * Reject an end that precedes the start. An absent or unparseable end is not an
 * error here — `end` is optional, and a malformed value is the schema's problem.
 */
export function validateEventRange(
  start: string | undefined,
  end: string | undefined,
): EventRangeResult {
  if (!start || !end) return { ok: true };
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return { ok: true };
  return e < s ? { ok: false, reason: "range-end-before-start" } : { ok: true };
}

// ── Further dates (event-multiple-dates D7) ─────────────────────────────────

/** Form field name; one `datetime-local` input per further date. */
export const DATES_FIELD = "dates";

export type DatesError = "dates-invalid" | "dates-too-many" | "recurrence-and-dates";

export type DatesFormResult =
  | { ok: true; dates: string[] | undefined }
  | { ok: false; reason: DatesError };

/**
 * Read the admin form's date list: each value typed as Amsterdam wall time and
 * stored as an unambiguous ISO string, like `start` (siteInputToIso). Empty
 * rows are ignored; a date entered twice, or equal to the start, collapses; an
 * unreadable value or more than {@link MAX_EVENT_DATES} dates is refused, so a
 * malformed list is never stored.
 *
 * An event repeats on a rule or names its dates (D2): a list alongside a
 * recurrence is refused here, at the form layer, while the schema stays
 * permissive so an odd stored document keeps rendering.
 *
 * Returns `dates: undefined` for an empty list, which on an edit drops the
 * stored field — the edit form presents the list, so an empty one means none.
 */
export function datesFromForm(
  form: FormData,
  startIso: string | undefined,
  hasRecurrence: boolean,
): DatesFormResult {
  const raw = form
    .getAll(DATES_FIELD)
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  if (raw.length === 0) return { ok: true, dates: undefined };
  if (hasRecurrence) return { ok: false, reason: "recurrence-and-dates" };

  const parsed: Date[] = [];
  for (const value of raw) {
    const iso = siteInputToIso(value);
    // siteInputToIso returns anything that is not a wall time unchanged, and
    // rolls an impossible one ("T25:00", "02-31") over; the round trip refuses
    // both.
    const d = iso && iso !== value ? new Date(iso) : null;
    if (!d || toSiteInputValue(d) !== value.slice(0, 16)) {
      return { ok: false, reason: "dates-invalid" };
    }
    parsed.push(d);
  }

  const start = startIso ? new Date(startIso) : undefined;
  const distinct = new Set(parsed.map((d) => d.getTime()));
  if (start) distinct.delete(start.getTime());
  if (distinct.size > MAX_EVENT_DATES) return { ok: false, reason: "dates-too-many" };

  return { ok: true, dates: normaliseDates(parsed, start)?.map((d) => d.toISOString()) };
}
