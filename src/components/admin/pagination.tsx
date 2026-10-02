import Link from "next/link";
import { cn } from "@/lib/cn";

const pageLink =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border bg-surface px-3 font-medium hover:bg-surface-2";

/** The page numbers to offer: all of a short list, else the ends and the neighbours. */
function pageNumbers(page: number, pageCount: number): Array<number | "gap"> {
  const keep = new Set([1, pageCount, page - 1, page, page + 1]);
  const out: Array<number | "gap"> = [];
  for (let n = 1; n <= pageCount; n++) {
    if (pageCount <= 7 || keep.has(n)) out.push(n);
    else if (out[out.length - 1] !== "gap") out.push("gap");
  }
  return out;
}

/**
 * Page controls for a backend list whose view is in the address: plain links,
 * so they work without JavaScript. Renders nothing for a single page.
 */
export function Pagination({
  page,
  pageCount,
  hrefs,
}: {
  page: number;
  pageCount: number;
  /** The address of each page, by page number (index 0 is page 1). */
  hrefs: string[];
}) {
  if (pageCount <= 1) return null;
  const href = (n: number) => hrefs[n - 1];
  return (
    <nav aria-label="Pagina's" className="mt-6">
      <ul className="flex flex-wrap items-center gap-1 text-sm">
        {page > 1 ? (
          <li>
            <Link href={href(page - 1)} className={pageLink}>
              Vorige
            </Link>
          </li>
        ) : null}
        {pageNumbers(page, pageCount).map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                href={href(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Pagina ${n}`}
                className={cn(pageLink, n === page && "border-brand bg-surface-2 font-semibold")}
              >
                {n}
              </Link>
            </li>
          ),
        )}
        {page < pageCount ? (
          <li>
            <Link href={href(page + 1)} className={pageLink}>
              Volgende
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
