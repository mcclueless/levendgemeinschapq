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
