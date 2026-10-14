import { eventOrganiserSlugs, type StoredOrganisers } from "./event-organisers";
import type { ContentType } from "./schema";
import type { EventMode } from "./event-mode";

/**
 * Who may do what in the backend (organisation-accounts D5): the one rule
 * every shared page and action asks. The administrator may do anything. An
 * organisation account may manage its own organiser page and the events whose
 * primary organiser its organisation is (user-roles-approval "Event ownership
 * by primary organiser"); it may see, but not change, an event that names its
 * organisation only as a further organiser; and it may do nothing else.
 *
 * Pure: a session and a document's organiser fields in, a yes or no out.
 */

/** What the rule needs to know about who is asking: a session, or an actor. */
export type Scope = { role: "admin" } | { role: "organisation"; org: string };

/** The organisation that owns an event: its primary organiser (D5). */
export function primaryOrganiser(event: StoredOrganisers): string | undefined {
  return event.organiser;
}

/** Whether `session` may edit, hide, show or delete the item. */
export function canManage(
  session: Scope | null,
  type: ContentType,
  item: { slug: string } & StoredOrganisers,
): boolean {
  if (!session) return false;
  if (session.role === "admin") return true;
  if (type === "organiser") return item.slug === session.org;
  if (type === "event") return primaryOrganiser(item) === session.org;
  return false;
}

/** Whether `session` may see the item in its backend list: manage, or co-organise. */
export function canView(
  session: Scope | null,
  type: ContentType,
  item: { slug: string } & StoredOrganisers,
): boolean {
  if (canManage(session, type, item)) return true;
  if (!session || session.role !== "organisation" || type !== "event") return false;
  return eventOrganiserSlugs(item).includes(session.org);
}

/**
 * The organisers an organisation account's event form may store: its own
 * organisation first, whatever the form posted, then the others it chose
 * (editorial-backend "Event form for an organisation account"). The
 * administrator's list is kept as posted.
 */
export function organisersFor(session: Scope, posted: readonly string[]): string[] {
  if (session.role === "admin") return [...posted];
  return [session.org, ...posted.filter((slug) => slug !== session.org)];
}

/**
 * Whether `session` may save an event in `mode`: the agenda-marker mode —
 * holidays and seasons, site-level curation — is the administrator's
 * (editorial-backend "Event form for an organisation account").
 */
export function allowedMode(session: Scope, mode: EventMode): boolean {
  return session.role === "admin" || mode !== "marker";
}

/** How a backend save is recorded on the document (D9). */
export function savedByLabel(session: Scope, email?: string): string {
  return session.role === "admin" ? "beheerder" : (email ?? session.org);
}
