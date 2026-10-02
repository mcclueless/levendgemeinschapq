/**
 * Where a backend action returns to (admin-content-table D6). A management list
 * sends its own address along as `terug`, so that hiding, publishing, deleting
 * or editing an item lands back on the same filtered, sorted page.
 *
 * The value comes from the request, so it is resolved as a URL first and judged
 * by where it leads rather than how it is spelled: `//host`, `/beheer/../x` and
 * `/beheer\host` all fail. Only a path under `/beheer/` is accepted; anything
 * else gives `fallback`. A backslash is refused outright: browsers read it as a
 * slash, and no backend address contains one.
 */
const ORIGIN = "http://beheer.invalid";

export function returnPath(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value === "" || value.includes("\\")) return fallback;
  let url: URL;
  try {
    url = new URL(value, ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== ORIGIN || !url.pathname.startsWith("/beheer/")) return fallback;
  return `${url.pathname}${url.search}`;
}

/** `path` with one more search parameter, keeping those it already has. */
export function withParam(path: string, name: string, value: string): string {
  const url = new URL(path, ORIGIN);
  url.searchParams.set(name, value);
  return `${url.pathname}${url.search}`;
}
