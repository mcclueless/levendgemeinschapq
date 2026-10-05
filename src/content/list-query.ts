import type { ContentType, PublishStatus } from "./schema";
import type { ContentSummary } from "./summaries";
import { fold } from "@/lib/text";
import { presentOccurrence } from "./event-presentation";

/**
 * The view of a backend management list (admin-content-table D4): which items
 * it shows, in what order, and which page. The view lives in the address, so it
 * survives a reload and the back button; these functions read it from the
 * search parameters and apply it. Pure, so the rules are testable without a
 * store or a request.
 */

export const PAGE_SIZE = 25;

export type ListSort = "titel" | "datum" | "status" | "gewijzigd";
export type ListDir = "asc" | "desc";
export type ListPeriod = "aankomend" | "geweest";

export interface ListQuery {
  status?: PublishStatus;
  /** Search text, trimmed; empty when there is none. */
  q: string;
  periode?: ListPeriod;
  /** A venue slug. */
  locatie?: string;
  /** An organiser slug. */
  organisator?: string;
  /** Absent means the type's default order. */
  sort?: ListSort;
  dir: ListDir;
  pagina: number;
}

/** Types whose items have a date to show and sort by. */
const DATED: readonly ContentType[] = ["event", "blog", "project"];
/** Types whose items can wait in the approval queue. */
const CAN_BE_PENDING: readonly ContentType[] = ["event", "blog"];
/** Types that can be filtered by location and organiser. */
const HAS_RELATION_FILTERS: readonly ContentType[] = ["event", "project"];

export const isDated = (type: ContentType) => DATED.includes(type);
export const canBePending = (type: ContentType) => CAN_BE_PENDING.includes(type);
export const hasRelationFilters = (type: ContentType) =>
  HAS_RELATION_FILTERS.includes(type);

/** The direction a column sorts in when first chosen. */
export const DEFAULT_DIR: Record<ListSort, ListDir> = {
  titel: "asc",
  status: "asc",
  datum: "desc",
  gewijzigd: "desc",
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

/**
 * The view named by the search parameters. Anything unknown, invalid, or not
 * applicable to the type falls back to its default rather than failing, so a
 * hand-edited or stale address still shows a list.
 */
export function parseListQuery(type: ContentType, params: RawParams): ListQuery {
  const status = first(params.status);
  const periode = first(params.periode);
  const sort = first(params.sort);
  const dir = first(params.dir);
  const pagina = Number(first(params.pagina));
  const relations = hasRelationFilters(type);

  const validStatus =
    status === "published" || status === "draft" || (status === "pending" && canBePending(type));
  const validSort =
    sort === "titel" || sort === "status" || sort === "gewijzigd" || (sort === "datum" && isDated(type));
  const chosenSort = validSort ? (sort as ListSort) : undefined;

  return {
    status: validStatus ? (status as PublishStatus) : undefined,
    q: first(params.q),
    periode:
      type === "event" && (periode === "aankomend" || periode === "geweest")
        ? periode
        : undefined,
    locatie: relations ? first(params.locatie) || undefined : undefined,
    organisator: relations ? first(params.organisator) || undefined : undefined,
    sort: chosenSort,
    dir:
      dir === "asc" || dir === "desc"
        ? dir
        : chosenSort
          ? DEFAULT_DIR[chosenSort]
          : "desc",
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
  };
}

/**
 * The search parameters for a view, leaving out everything at its default so
 * addresses stay short. `overrides` replace parts of the view; changing
 * anything but the page goes back to the first page.
 */
export function listQueryString(
  query: ListQuery,
  overrides: Partial<ListQuery> = {},
): string {
  const next = { ...query, ...overrides };
  if (!("pagina" in overrides)) next.pagina = 1;
  const params = new URLSearchParams();
  if (next.status) params.set("status", next.status);
  if (next.q) params.set("q", next.q);
  if (next.periode) params.set("periode", next.periode);
  if (next.locatie) params.set("locatie", next.locatie);
  if (next.organisator) params.set("organisator", next.organisator);
  if (next.sort) {
    params.set("sort", next.sort);
    if (next.dir !== DEFAULT_DIR[next.sort]) params.set("dir", next.dir);
  }
  if (next.pagina > 1) params.set("pagina", String(next.pagina));
  const out = params.toString();
  return out ? `?${out}` : "";
}

/** Whether a view narrows the list by search or filter (status aside). */
export const isNarrowed = (query: ListQuery) =>
  Boolean(query.q || query.periode || query.locatie || query.organisator);

/**
 * Whether an event still has a date today or later: its start, one of its
 * further dates, or a recurrence that has no end or ends today or later.
 */
export function eventIsUpcoming(
  event: Pick<ContentSummary, "start" | "dates" | "recurrence">,
  today: Date,
): boolean {
  const from = today.getTime();
  if (event.start && event.start.getTime() >= from) return true;
  if (event.dates?.some((d) => d.getTime() >= from)) return true;
  if (!event.recurrence) return false;
  const until = event.recurrence.until;
  return !until || until.getTime() >= from;
}

const byTitle = (a: ContentSummary, b: ContentSummary) =>
  a.title.localeCompare(b.title, "nl", { sensitivity: "base" });

/**
 * The date an event is listed by (admin-events-sort-by-next-date D1): its next
 * occurrence on or after `today`, else what its public page would show — the
 * same rule as that page, so a weekly event sorts by this week's date, not by
 * the January it started in.
 */
export function eventListDate(
  event: Pick<ContentSummary, "start" | "end" | "recurrence" | "dates">,
  today: Date,
): Date | undefined {
  if (!event.start) return undefined;
  return presentOccurrence(
    { start: event.start, end: event.end, recurrence: event.recurrence, dates: event.dates },
    today,
  ).start;
}

const dateOf = (item: ContentSummary, today: Date) =>
  (item.type === "event" ? eventListDate(item, today) : item.date)?.getTime();

/** Order of the statuses when sorting by status: as their labels read. */
const STATUS_ORDER: Record<PublishStatus, number> = {
  published: 0,
  pending: 1,
  draft: 2,
};

/** Compare two optional numbers ascending; an item without one sorts last. */
function byNumber(a: number | undefined, b: number | undefined, dir: ListDir) {
  if (a === undefined || b === undefined) {
    return a === b ? 0 : a === undefined ? 1 : -1;
  }
  return dir === "asc" ? a - b : b - a;
}

function comparator(type: ContentType, query: ListQuery, today: Date) {
  // Default order: dated types newest first, the others by name.
  const sort = query.sort ?? (isDated(type) ? "datum" : "titel");
  const dir = query.sort ? query.dir : DEFAULT_DIR[sort];
  const flip = dir === "asc" ? 1 : -1;
  return (a: ContentSummary, b: ContentSummary) => {
    const primary =
      sort === "titel"
        ? flip * byTitle(a, b)
        : sort === "status"
          ? flip * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
          : sort === "datum"
            ? byNumber(dateOf(a, today), dateOf(b, today), dir)
            : byNumber(a.modified?.getTime(), b.modified?.getTime(), dir);
    return primary || byTitle(a, b) || a.slug.localeCompare(b.slug);
  };
}

export interface ListResult {
  /** The rows of the page shown. */
  rows: ContentSummary[];
  /** How many items the view matches, across all pages. */
  total: number;
  /** The page shown: the requested one, or the last when that is past the end. */
  page: number;
  pageCount: number;
  /** Items of the type per status, whatever the search and filters. */
  counts: Record<PublishStatus | "all", number>;
}

/** The items of one type that a view shows, ordered, and cut to its page. */
export function applyListQuery(
  type: ContentType,
  summaries: readonly ContentSummary[],
  query: ListQuery,
  today: Date,
): ListResult {
  const counts = { all: summaries.length, published: 0, pending: 0, draft: 0 };
  for (const item of summaries) counts[item.status] += 1;

  const needle = fold(query.q);
  const matched = summaries
    .filter((item) => {
      if (query.status && item.status !== query.status) return false;
      if (needle && !fold(item.title).includes(needle)) return false;
      if (query.locatie && !item.venues.includes(query.locatie)) return false;
      if (query.organisator && !item.organisers.includes(query.organisator)) return false;
      if (query.periode) {
        const upcoming = eventIsUpcoming(item, today);
        if (upcoming !== (query.periode === "aankomend")) return false;
      }
      return true;
    })
    .sort(comparator(type, query, today));

  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.min(query.pagina, pageCount);
  return {
    rows: matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: matched.length,
    page,
    pageCount,
    counts,
  };
}
