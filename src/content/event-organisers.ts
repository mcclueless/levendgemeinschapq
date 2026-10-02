/**
 * An event's organisers, stored in two fields and used as one list
 * (event-multiple-organisers D1–D3). Only this module knows about the split:
 * everything else reads a list of organisers.
 *
 * Pure, so the read and write rules are testable without the store.
 */

/** The stored organiser fields of an event. */
export interface StoredOrganisers {
  organiser?: string;
  moreOrganisers?: string[];
}

/**
 * Every organiser slug an event names, in stored order, without duplicates.
 * A duplicate can appear when code that predates `moreOrganisers` edits the
 * file and keeps that field (D1, risks).
 */
export function eventOrganiserSlugs(data: StoredOrganisers): string[] {
  return [...new Set([data.organiser, ...(data.moreOrganisers ?? [])])].filter(
    (slug): slug is string => Boolean(slug),
  );
}

/**
 * The event's organisers resolved against `bySlug`, sorted by name. A slug that
 * no longer resolves is left out, as an unresolved single organiser was (D2).
 */
export function resolveOrganisers<T extends { name: string }>(
  data: StoredOrganisers,
  bySlug: ReadonlyMap<string, T>,
): T[] {
  return eventOrganiserSlugs(data)
    .map((slug) => bySlug.get(slug))
    .filter((o): o is T => o !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

/**
 * The stored fields for the organisers chosen on the event form (D3): the first
 * in `organiser`, the rest in `moreOrganisers`, in submitted order and without
 * duplicates. Both keys are always present so that the merge on save clears
 * what the editor removed; `undefined` values are not written.
 */
export function organiserFields(slugs: readonly string[]): {
  organiser: string | undefined;
  moreOrganisers: string[] | undefined;
} {
  const [first, ...rest] = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))];
  return { organiser: first, moreOrganisers: rest.length > 0 ? rest : undefined };
}

/**
 * The review queue's label for an event's organisers: their names joined, "Geen
 * organisator" when it names none, and "<slug> (onbekend)" for one that no
 * longer exists, so a reviewer can tell an omission from broken data.
 */
export function organisersLabel(data: StoredOrganisers, names: ReadonlyMap<string, string>): string {
  const slugs = eventOrganiserSlugs(data);
  if (slugs.length === 0) return "Geen organisator";
  return slugs.map((slug) => names.get(slug) ?? `${slug} (onbekend)`).join(", ");
}

/** Whether an event lists the organiser `slug` among its organisers (D5). */
export function isOrganisedBy(event: { organisers: readonly { slug: string }[] }, slug: string): boolean {
  return event.organisers.some((o) => o.slug === slug);
}
