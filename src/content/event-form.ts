import { MAX_EVENT_DATES, normaliseDates } from "./event-dates";
import type { EventMode } from "./event-mode";
import { isWebUrl, withScheme } from "./socials-form";
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

/**
 * An agenda marker's date input as the start of that day, `YYYY-MM-DDT00:00`
 * (event-no-page D4). Accepts a date (`type="date"`) or a date and time
 * (`datetime-local`, without scripts) and drops the time, so the existing
 * wall-time parsing applies unchanged. Anything else passes through for that
 * parsing to reject.
 */
export function markerDayInput(value: string | undefined): string | undefined {
  const day = value?.trim().match(/^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}(?::\d{2})?)?$/)?.[1];
  return day ? `${day}T00:00` : value;
}

// ── Where an event leads (event-external-link D4) ───────────────────────────

/** A trimmed form value, or nothing when it is empty or absent. */
function field(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

/**
 * The event form's mode choice, with the date rewriting a marker needs.
 *
 * One radio group replaces the "Geen pagina" checkbox, so the three modes are
 * mutually exclusive by construction and the action never writes both stored
 * fields (event-external-link D1, D4). An absent or unknown value reads as
 * `page`, the default and the mode of every event stored before this change.
 *
 * Shared between the create and edit actions so the two cannot disagree about
 * what a mode means, and pure apart from the date rewriting it does on the
 * form, so it is testable without a request.
 */
export type EventModeFormResult =
  | { ok: true; mode: EventMode; externalUrl?: string }
  | { ok: false; reason: "external-url" };

export function readEventMode(form: FormData): EventModeFormResult {
  const chosen = form.get("mode");
  const mode: EventMode =
    chosen === "marker" || chosen === "external" ? chosen : "page";

  // A marker drops any time: its start and every further date are rewritten to
  // the start of their day before any parsing, so a typed time is ignored and a
  // date-only value parses like any other (event-no-page D4). An event with a
  // time keeps it, but a bare date — an input still in marker mode when the
  // choice was just changed — reads as the start of that day rather than being
  // refused.
  const day = (v: string | undefined) =>
    mode === "marker" || (v && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()))
      ? markerDayInput(v)
      : v;
  const start = day(field(form, "start"));
  if (start) form.set("start", start);
  const dates = form.getAll(DATES_FIELD).map((v) => (typeof v === "string" ? v : ""));
  form.delete(DATES_FIELD);
  for (const value of dates) form.append(DATES_FIELD, day(value) ?? "");

  if (mode !== "external") return { ok: true, mode };
  // The address goes straight into an `href`, so the scheme check is what
  // matters, not the URL parse (see `isWebUrl`). A scheme-less value is
  // normalised rather than refused, as a pasted social link is.
  const typed = field(form, "externalUrl");
  const url = typed ? withScheme(typed) : undefined;
  if (!url || !isWebUrl(url)) return { ok: false, reason: "external-url" };
  return { ok: true, mode, externalUrl: url };
}
