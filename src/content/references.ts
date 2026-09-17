/**
 * Inbound references to Venues and Organisers, described once
 * (editable-permalinks D1).
 *
 * The hide/delete guards and the permalink rename must agree on exactly which
 * fields point at a Venue or Organiser. They were maintained separately before,
 * and the guard silently missed Projects, Organiser locations, and feed defaults.
 * Everything that asks "who points at this slug?" reads this table instead.
 *
 * Pure and free of `server-only` deps on purpose, so the rewrite contract can be
 * unit-tested without a store.
 */

/** A kind of document that can point at a Venue or Organiser. */
export type ReferrerKind = "event" | "project" | "blog" | "organiser" | "feed";

/** The content types that other documents point at. */
export type ReferencedType = "venue" | "organiser";

/** Frontmatter field names, per referenced type, that hold a slug. */
type FieldsByTarget = Partial<Record<ReferencedType, string[]>>;

/**
 * Every field that stores a Venue or Organiser slug. Array-valued fields are
 * recognised at runtime, so one table serves both scalar and list references.
 * Feeds are configuration under `feeds/`, not content, but store slugs all the
 * same.
 */
export const REFERENCE_FIELDS: Record<ReferrerKind, FieldsByTarget> = {
  event: { venue: ["venue"], organiser: ["organiser"] },
  project: { venue: ["venue"], organiser: ["organisers"] },
  blog: { venue: ["relatedVenues"], organiser: ["relatedOrganisers"] },
  organiser: { venue: ["location"] },
  feed: { venue: ["defaultVenue"], organiser: ["defaultOrganiser"] },
};

/** The referrer kinds that can point at a given type. */
export function referrerKindsOf(type: ReferencedType): ReferrerKind[] {
  return (Object.keys(REFERENCE_FIELDS) as ReferrerKind[]).filter(
    (kind) => (REFERENCE_FIELDS[kind][type] ?? []).length > 0,
  );
}

/** Whether `frontmatter` of `kind` points at the `type` item with `slug`. */
export function pointsAt(
  frontmatter: Record<string, unknown>,
  kind: ReferrerKind,
  type: ReferencedType,
  slug: string,
): boolean {
  return (REFERENCE_FIELDS[kind][type] ?? []).some((field) => {
    const value = frontmatter[field];
    return Array.isArray(value) ? value.includes(slug) : value === slug;
  });
}

/**
 * The frontmatter with every reference to `from` replaced by `to`, or `null`
 * when nothing in it points at `from`. Only the reference fields for `type` are
 * touched: a title or excerpt that happens to contain the slug text is left
 * alone. Array order is preserved.
 *
 * Returning `null` for an already-rewritten document is what makes a repeated
 * rename idempotent (editable-permalinks D4).
 */
export function rewriteReferences(
  frontmatter: Record<string, unknown>,
  kind: ReferrerKind,
  type: ReferencedType,
  from: string,
  to: string,
): Record<string, unknown> | null {
  if (!pointsAt(frontmatter, kind, type, from)) return null;
  const patched = { ...frontmatter };
  for (const field of REFERENCE_FIELDS[kind][type] ?? []) {
    const value = patched[field];
    if (Array.isArray(value)) {
      patched[field] = value.map((v) => (v === from ? to : v));
    } else if (value === from) {
      patched[field] = to;
    }
  }
  return patched;
}
