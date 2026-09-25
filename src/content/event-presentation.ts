import type { Recurrence } from "./schema";
import { firstOccurrenceFrom, occurrencesInRange } from "./recurrence";
import { allDates, occurrenceEnd, parseDayParam } from "./event-dates";

/**
 * Which occurrence an event page presents, and what else it lists
 * (event-multiple-dates D5, D6). Pure and clock-injected, so the page body,
 * its share metadata and its structured data compute the same thing.
 */

export interface PresentableEvent {
  start: Date;
  end?: Date;
  recurrence?: Recurrence;
  dates?: Date[];
}

export interface PresentedDate {
  start: Date;
  end?: Date;
  /** Before the current day: shown, but never as upcoming. */
  past: boolean;
}

export interface Presentation extends PresentedDate {
  /** Whether a requested day (`?datum=`) was honoured. */
  requested: boolean;
  /**
   * The event's other dates, soonest first, when it is a date series. Empty for
   * a single date or a recurrence, whose dates are implied by its rule.
   */
  others: PresentedDate[];
}

/**
 * The occurrence to present:
 *  1. the day `requested` names (`?datum=`), when the event has an occurrence
 *     on it — a malformed or unknown day is ignored, never an error;
 *  2. else the next occurrence at or after `today`;
 *  3. else, for a date series, its last date — a visitor arriving after the
 *     series ended should not see its first night as though it were the story;
 *     for anything else, its start, as before.
 */
export function presentOccurrence(
  event: PresentableEvent,
  today: Date,
  requested?: unknown,
): Presentation {
  const { start, recurrence, dates } = event;
  const listed = recurrence ? [start] : allDates(start, dates);

  const day = parseDayParam(requested);
  const onRequestedDay = day
    ? occurrencesInRange(
        start,
        recurrence,
        day.from,
        new Date(day.until.getTime() - 1),
        dates,
      )[0]
    : undefined;

  const shown =
    onRequestedDay ??
    firstOccurrenceFrom(start, recurrence, today, dates) ??
    listed[listed.length - 1];

  const describe = (d: Date): PresentedDate => ({
    start: d,
    end: occurrenceEnd(event, d),
    past: d < today,
  });

  return {
    ...describe(shown),
    requested: onRequestedDay !== undefined,
    others:
      listed.length > 1
        ? listed.filter((d) => d.getTime() !== shown.getTime()).map(describe)
        : [],
  };
}
