/**
 * URL state for the switchable event listings on the homepage and `/agenda`
 * (event-list-table-view D1, D3).
 *
 * The view and the number of events shown live only in the URL
 * (`?weergave=tabel&aantal=12`): nothing is stored, so a new visit starts on
 * cards, while Back and shared links restore what was on screen. Defaults are
 * left out of the URL, so the plain path stays the canonical form.
 */

export type ListingView = "kaarten" | "tabel";

export interface ListingState {
  view: ListingView;
  /** Total number of events shown — not a page number (D3). */
  count: number;
}

/** Fragment the controls link to, so a no-JS page load lands on the listing. */
export const LISTING_ANCHOR = "evenementen";

const MAX_COUNT = 500;

type ParamValue = string | string[] | undefined;

function first(value: ParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Read the listing state from search parameters. An unknown view means cards;
 * a count that is not a positive whole number means the page's initial count.
 */
export function parseListingState(
  params: Record<string, ParamValue>,
  initialCount: number,
): ListingState {
  const view: ListingView = first(params.weergave) === "tabel" ? "tabel" : "kaarten";
  const raw = first(params.aantal);
  const n = raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : NaN;
  const count = Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_COUNT) : initialCount;
  return { view, count };
}

/** Link to `basePath` with the given state, leaving out default values. */
export function listingHref(
  basePath: string,
  state: ListingState,
  initialCount: number,
): string {
  const params = new URLSearchParams();
  if (state.view === "tabel") params.set("weergave", "tabel");
  if (state.count !== initialCount) params.set("aantal", String(state.count));
  const query = params.toString();
  return `${basePath}${query ? `?${query}` : ""}#${LISTING_ANCHOR}`;
}
