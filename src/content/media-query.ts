import type { MediaItem } from "./media";
// Not from "./media-details": this module is also used in the browser.
import { mediaName } from "@/lib/media-name";
import { fold } from "@/lib/text";

/**
 * The view of the backend gallery (gallery-find-and-describe D1): which images
 * it shows, in what order, and which page. As in the content lists, the view
 * lives in the address; these functions read it and apply it. Pure, so the
 * rules are testable without a store.
 */

export const MEDIA_PAGE_SIZE = 48;

export type MediaSort = "datum" | "naam" | "grootte";
export type MediaDir = "asc" | "desc";
export type MediaUse = "gebruikt" | "ongebruikt";

export interface MediaQuery {
  /** Search text, trimmed; empty when there is none. */
  q: string;
  gebruik?: MediaUse;
  sort: MediaSort;
  dir: MediaDir;
  pagina: number;
}

/** The direction a sort starts in: newest and largest first, names A to Z. */
export const MEDIA_DEFAULT_DIR: Record<MediaSort, MediaDir> = {
  datum: "desc",
  naam: "asc",
  grootte: "desc",
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

/** The view named by the search parameters; anything invalid falls back to its default. */
export function parseMediaQuery(params: RawParams): MediaQuery {
  const gebruik = first(params.gebruik);
  const rawSort = first(params.sort);
  const dir = first(params.dir);
  const pagina = Number(first(params.pagina));
  const sort: MediaSort = rawSort === "naam" || rawSort === "grootte" ? rawSort : "datum";
  return {
    q: first(params.q),
    gebruik: gebruik === "gebruikt" || gebruik === "ongebruikt" ? gebruik : undefined,
    sort,
    dir: dir === "asc" || dir === "desc" ? dir : MEDIA_DEFAULT_DIR[sort],
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
  };
}

/**
 * The search parameters for a view, leaving out everything at its default.
 * Changing anything but the page goes back to the first page.
 */
export function mediaQueryString(query: MediaQuery, overrides: Partial<MediaQuery> = {}): string {
  const next = { ...query, ...overrides };
  if (!("pagina" in overrides)) next.pagina = 1;
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.gebruik) params.set("gebruik", next.gebruik);
  if (next.sort !== "datum") params.set("sort", next.sort);
  if (next.dir !== MEDIA_DEFAULT_DIR[next.sort]) params.set("dir", next.dir);
  if (next.pagina > 1) params.set("pagina", String(next.pagina));
  const out = params.toString();
  return out ? `?${out}` : "";
}

/** Whether a view narrows the gallery by search or filter. */
export const isMediaNarrowed = (query: MediaQuery) => Boolean(query.q || query.gebruik);

/** What the backend calls an image: its title when it has one, else its file name. */
export const mediaLabel = (item: Pick<MediaItem, "key" | "title">) =>
  item.title || mediaName(item.key);

/** Whether an image matches a search: on its file name, title or alternative text. */
export function mediaMatches(item: Pick<MediaItem, "key" | "title" | "alt">, q: string): boolean {
  const needle = fold(q.trim());
  if (!needle) return true;
  return [mediaName(item.key), item.title, item.alt].some(
    (text) => text !== undefined && fold(text).includes(needle),
  );
}

export interface MediaResult {
  /** The images of the page shown. */
  rows: MediaItem[];
  /** How many images the view matches, across all pages. */
  total: number;
  /** The page shown: the requested one, or the last when that is past the end. */
  page: number;
  pageCount: number;
}

/**
 * The images a view shows, ordered and cut to its page. `inUse` holds the
 * addresses of the images that some content item uses.
 */
export function applyMediaQuery(
  items: readonly MediaItem[],
  inUse: ReadonlySet<string>,
  query: MediaQuery,
): MediaResult {
  const flip = query.dir === "asc" ? 1 : -1;
  const byName = (a: MediaItem, b: MediaItem) =>
    mediaLabel(a).localeCompare(mediaLabel(b), "nl", { sensitivity: "base" });

  const matched = items
    .filter((item) => {
      if (!mediaMatches(item, query.q)) return false;
      if (query.gebruik && inUse.has(item.url) !== (query.gebruik === "gebruikt")) return false;
      return true;
    })
    .sort((a, b) => {
      const primary =
        query.sort === "naam"
          ? flip * byName(a, b)
          : query.sort === "grootte"
            ? flip * (a.size - b.size)
            : flip * a.lastModified.localeCompare(b.lastModified);
      return primary || byName(a, b) || a.key.localeCompare(b.key);
    });

  const pageCount = Math.max(1, Math.ceil(matched.length / MEDIA_PAGE_SIZE));
  const page = Math.min(query.pagina, pageCount);
  return {
    rows: matched.slice((page - 1) * MEDIA_PAGE_SIZE, page * MEDIA_PAGE_SIZE),
    total: matched.length,
    page,
    pageCount,
  };
}

/** "48 kB" / "2,3 MB" for a file size in bytes. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} MB`;
}
