import Link from "next/link";
import { cn } from "@/lib/cn";
import { listingHref, type ListingState, type ListingView } from "@/lib/listing-view";

/**
 * Controls for the switchable event listings on the homepage and `/agenda`
 * (event-list-table-view D2, D6). Plain links carrying the state in the URL:
 * with JavaScript `scroll={false}` keeps the reader's place during the soft
 * navigation; without it they are ordinary page loads that land on the listing.
 */

export interface SwitchableListing {
  state: ListingState;
  basePath: string;
  initialCount: number;
  batch: number;
}

const VIEWS: Array<{ view: ListingView; label: string }> = [
  { view: "kaarten", label: "Kaarten" },
  { view: "tabel", label: "Tabel" },
];

/** Cards ↔ table. Switching keeps the number of events shown. */
export function ViewSwitch({ listing }: { listing: SwitchableListing }) {
  const { state, basePath, initialCount } = listing;
  return (
    <div
      role="group"
      aria-label="Weergave"
      className="inline-flex rounded-md border border-border bg-surface p-0.5"
    >
      {VIEWS.map(({ view, label }) => {
        const active = state.view === view;
        return (
          <Link
            key={view}
            href={listingHref(basePath, { ...state, view }, initialCount)}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2",
              active ? "bg-brand-strong text-white" : "text-ink hover:bg-surface-2",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * "N van M evenementen getoond" as a live status, plus "Meer laden" while more
 * exist. Loading more raises the count and keeps the view (D3).
 */
export function LoadMore({
  listing,
  shown,
  total,
}: {
  listing: SwitchableListing;
  shown: number;
  total: number;
}) {
  const { state, basePath, initialCount, batch } = listing;
  if (total === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      {shown < total ? (
        <Link
          href={listingHref(basePath, { ...state, count: state.count + batch }, initialCount)}
          scroll={false}
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-strong px-5 font-medium text-white transition-colors hover:bg-brand focus-visible:outline-3 focus-visible:outline-offset-2"
        >
          Meer laden
        </Link>
      ) : null}
      <p role="status" className="text-sm text-muted">
        {shown} van {total} {total === 1 ? "evenement" : "evenementen"} getoond
      </p>
    </div>
  );
}
