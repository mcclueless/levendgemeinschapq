/**
 * Where an event leads (event-external-link D1, D2).
 *
 * The mode is derived from two optional fields, never stored as one: every
 * document written before this change has neither and keeps its mode with no
 * migration, and `parseAll` skips a document that fails validation — the same
 * constraint that keeps `noPage` optional.
 *
 * A hand-edited file carrying both is a marker, the more restrictive mode, so
 * no unintended outbound link appears. The form never writes both (D4).
 *
 * Pure and dependency-free: `event-dates.ts` (`occurrenceLink`), the
 * repository, the sitemap and the listings all read the same rule from here.
 */

export type EventMode = "page" | "external" | "marker";

/** The two stored fields the mode is derived from. */
export interface EventModeFields {
  noPage?: boolean;
  externalUrl?: string;
}

export function eventMode(event: EventModeFields): EventMode {
  if (event.noPage) return "marker";
  return event.externalUrl ? "external" : "page";
}

/** Whether the event has a page on this site: neither a marker nor external. */
export function hasOwnPage(event: EventModeFields): boolean {
  return eventMode(event) === "page";
}

/**
 * The site an external link opens, for the text that names it to a screen
 * reader: the hostname without `www.`, so "opent website van buurttuin.nl".
 * An unparseable address yields nothing rather than throwing.
 */
export function externalHost(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./i, "") || undefined;
  } catch {
    return undefined;
  }
}

/**
 * The address an external event links to, or `undefined` for every other mode
 * — what a listing needs to decide between a route on this site and a plain
 * outbound link.
 */
export function externalLink(event: EventModeFields): string | undefined {
  return eventMode(event) === "external" ? event.externalUrl : undefined;
}
