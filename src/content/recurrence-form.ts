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

/**
 * What the Herhaling select posts: a *choice*, each standing for a frequency
 * and an interval (recurrence-biweekly D2). Every two weeks is the weekly
 * frequency with interval 2 — the shape the calendar import already writes,
 * so nothing downstream needs to know a new choice exists (D1).
 */
export type RecurrenceChoice = "weekly" | "biweekly" | "monthly";

export const CHOICES: Record<RecurrenceChoice, { freq: RecurrenceFreq; interval: number }> = {
  weekly: { freq: "weekly", interval: 1 },
  biweekly: { freq: "weekly", interval: 2 },
  monthly: { freq: "monthly", interval: 1 },
};

/** The editorial backend offers every choice. */
export const ADMIN_CHOICES = ["weekly", "biweekly", "monthly"] as const;
/** The public form offers weekly only; the rest stays admin-only (add-recurrence-end-date D7). */
export const PUBLIC_CHOICES = ["weekly"] as const;

/**
 * The edit form's "keep what is stored" value (D3): posted by the option the
 * edit form adds for a stored rhythm no choice expresses, such as an imported
 * every three weeks. Meaningful only when a stored recurrence is passed in.
 */
export const STORED_CHOICE = "stored";

/**
 * The choice that stands for a stored recurrence, or `undefined` when none
 * does — the edit form then shows the rhythm as its own option (D3). A missing
 * interval means every one, as everywhere else.
 */
export function choiceFor(
  recurrence: { freq: RecurrenceFreq; interval?: number } | undefined,
): RecurrenceChoice | undefined {
  if (!recurrence) return undefined;
  const interval = recurrence.interval ?? 1;
  return (Object.keys(CHOICES) as RecurrenceChoice[]).find(
    (c) => CHOICES[c].freq === recurrence.freq && CHOICES[c].interval === interval,
  );
}

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
 * - A choice outside `allow` — absent, "none", or a value a hand-crafted POST
 *   supplied — yields no recurrence rather than an error (design D6, D7). There
 *   is no legitimate UI path that produces one.
 * - A permitted choice **requires** an end date (design D5). Enforced here,
 *   at the form layer only: `RecurrenceSchema.until` stays optional so existing
 *   open-ended documents and open-ended iCal imports remain valid (design D2).
 * - `stored`, with a stored recurrence passed in, keeps that recurrence's
 *   frequency and interval (recurrence-biweekly D3). It is what the edit
 *   form's untouched select posts for a rhythm no choice expresses, so a
 *   title edit cannot flatten an imported "every 3 weeks"
 *   (docs/bugs/recurrence-edit-clobber.md). A choice the editor makes
 *   replaces frequency and interval entirely.
 */
export function recurrenceFromForm(
  form: FormData,
  start: Date | undefined,
  allow: readonly RecurrenceChoice[],
  /** The stored recurrence, when editing; what `stored` keeps. */
  stored?: { freq: RecurrenceFreq; interval?: number },
): RecurrenceFormResult {
  const raw = field(form, RECURRENCE_FIELD);
  const choice = allow.find((c) => c === raw);
  const rule =
    raw === STORED_CHOICE && stored
      ? { freq: stored.freq, interval: stored.interval ?? 1 }
      : choice
        ? CHOICES[choice]
        : undefined;
  if (!rule) return { ok: true, recurrence: undefined };

  const rawUntil = field(form, RECURRENCE_UNTIL_FIELD);
  if (!rawUntil) return { ok: false, reason: "recurrence-missing" };

  const until = parseUntilInput(rawUntil);
  if (!until) return { ok: false, reason: "recurrence-missing" };

  if (start && !Number.isNaN(start.getTime()) && until < start) {
    return { ok: false, reason: "recurrence-range" };
  }

  return { ok: true, recurrence: { freq: rule.freq, interval: rule.interval, until } };
}
