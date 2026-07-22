import type { Recurrence } from "./schema";

/**
 * Recurrence *form* parsing, shared by the editorial backend and the public
 * submission form (add-recurrence-end-date design D8). Kept in its own module —
 * not in `recurrence.ts` — so the pure expansion logic stays free of form
 * concerns and is not dragged into pages that only render occurrences.
 *
 * Both surfaces parse through here so they cannot drift on the end-of-day
 * normalisation (D4) or the validation rules (D5). Which frequencies a surface
 * may offer is a *parameter*, which is how the public form's narrower set (D7)
 * is expressed without forking the logic.
 */

/** Form field names, shared so the two forms cannot disagree on them. */
export const RECURRENCE_FIELD = "recurrence";
export const RECURRENCE_UNTIL_FIELD = "recurrenceUntil";

export type RecurrenceFreq = "weekly" | "monthly";

/** The editorial backend offers both intervals. */
export const ADMIN_FREQUENCIES = ["weekly", "monthly"] as const;
/** The public form offers weekly only; monthly stays admin-only (design D7). */
export const PUBLIC_FREQUENCIES = ["weekly"] as const;

/**
 * Why a recurrence was rejected. Two distinct reasons, reported distinguishably
 * because they need different corrections from the user.
 */
export type RecurrenceError = "recurrence-missing" | "recurrence-range";

export type RecurrenceFormResult =
  | { ok: true; recurrence: Recurrence | undefined }
  | { ok: false; reason: RecurrenceError };

function field(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

/**
 * Parse a `<input type="date">` value ("YYYY-MM-DD") as the **last instant** of
 * that day, in the server's local zone.
 *
 * Two reasons this is not `new Date(value)`:
 *  - A date-only string is parsed as UTC by `new Date`, while the
 *    "YYYY-MM-DDTHH:mm" start values used elsewhere are parsed as local time.
 *    Mixing the two would shift comparisons by the UTC offset.
 *  - `occurrencesInRange` breaks on `occ > end`, so a midnight cut-off would
 *    exclude an occurrence later in the day on the final date — making the
 *    "tot en met" (up to and including) label a lie (design D4).
 */
export function parseUntilInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d, 23, 59, 59, 999);
  // Reject values that only *look* like a date but roll over (e.g. 2026-13-45).
  const roundTrips =
    date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d;
  return roundTrips ? date : null;
}

/**
 * Read the recurrence controls from a submitted form.
 *
 * - A frequency outside `allow` — absent, "none", or a value a hand-crafted POST
 *   supplied — yields no recurrence rather than an error (design D6, D7). There
 *   is no legitimate UI path that produces one.
 * - A permitted frequency **requires** an end date (design D5). Enforced here,
 *   at the form layer only: `RecurrenceSchema.until` stays optional so existing
 *   open-ended documents and open-ended iCal imports remain valid (design D2).
 */
export function recurrenceFromForm(
  form: FormData,
  start: Date | undefined,
  allow: readonly RecurrenceFreq[],
  /**
   * The stored `interval`, when editing. No form exposes this field, so
   * rebuilding the recurrence from the form alone silently reset an
   * iCal-imported "every 2 weeks" to every week on any save — including a save
   * that only changed the title (docs/bugs/recurrence-edit-clobber.md).
   * Carrying it through preserves what the editor never had a chance to see.
   */
  storedInterval?: number,
): RecurrenceFormResult {
  const raw = field(form, RECURRENCE_FIELD);
  const freq = allow.find((f) => f === raw);
  if (!freq) return { ok: true, recurrence: undefined };

  const rawUntil = field(form, RECURRENCE_UNTIL_FIELD);
  if (!rawUntil) return { ok: false, reason: "recurrence-missing" };

  const until = parseUntilInput(rawUntil);
  if (!until) return { ok: false, reason: "recurrence-missing" };

  if (start && !Number.isNaN(start.getTime()) && until < start) {
    return { ok: false, reason: "recurrence-range" };
  }

  const interval =
    storedInterval && Number.isInteger(storedInterval) && storedInterval > 0
      ? storedInterval
      : 1;

  return { ok: true, recurrence: { freq, interval, until } };
}
