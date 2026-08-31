import { formatWhen } from "./date";
import { recurrenceLabel, type RecurrenceLike } from "./recurrence-label";

/**
 * Composes the social-sharing title and description for an event
 * (share-event-previews D1, D2, D6).
 *
 * A link preview offers exactly three slots — image, title, description — plus
 * an automatic domain label. There is no layout to control and no field to add,
 * so every fact the card must carry has to be packed into the title or the
 * description.
 *
 * Clients truncate the description after a short, client-determined length
 * (roughly two lines, varying by device). Ordering is therefore load-bearing
 * rather than cosmetic: whatever is placed last is what disappears. Date, time
 * and recurrence lead because they are short, bounded, and are the facts that
 * decide whether a reader is interested; the excerpt trails because it is long,
 * unbounded, and the most expendable. Correctness does not depend on knowing the
 * exact cut point, only on putting the important facts before it.
 */

const SEPARATOR = " · ";

/** Uppercases the first character, leaving the rest untouched. */
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * "Za 5 sep · 14:00 · Elke 2 weken — Elke tweede zaterdag schuiven we aan…"
 *
 * Segments are joined rather than templated, so an absent value never leaves a
 * stray separator or a dangling dash. `nl-NL` formats a short date with a
 * lowercase weekday ("za 5 sep"); the first letter is capitalised here because
 * this string opens a card, and only here — the page body keeps the locale's own
 * casing.
 */
export function shareDescription({
  when,
  recurrence,
  excerpt,
}: {
  when: Date;
  recurrence?: RecurrenceLike;
  excerpt?: string;
}): string {
  const facts = [capitalise(formatWhen(when)), recurrenceLabel(recurrence)]
    .filter(Boolean)
    .join(SEPARATOR);

  const summary = excerpt?.trim();
  return summary ? `${facts} — ${summary}` : facts;
}

/**
 * "Buurtborrel in het Groene Huis · Het Groene Huis"
 *
 * The venue rides in the title rather than the description because the title is
 * shown in full and is far less likely to be truncated, and because "where" is
 * high-value for a neighbourhood audience judging whether an event is within
 * walking distance. An event with no venue yields the title alone, with no
 * trailing separator.
 */
export function shareTitle(title: string, venueName?: string | null): string {
  const venue = venueName?.trim();
  return venue ? `${title}${SEPARATOR}${venue}` : title;
}
