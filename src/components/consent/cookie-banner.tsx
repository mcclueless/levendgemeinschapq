"use client";

import Link from "next/link";
import { useConsent } from "./consent-context";

/**
 * EU cookie notification (accessibility-compliance spec). Shown until the
 * visitor makes a choice; no non-essential cookies/scripts load before then
 * (enforced by the consent gates, e.g. the map). Essential cookies only by
 * default.
 */
export function CookieBanner() {
  const { decided, acceptAll, rejectAll } = useConsent();

  if (decided) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookiemelding"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-2xl text-sm text-muted">
          We gebruiken alleen noodzakelijke cookies om de site te laten werken.
          Voor extra’s zoals kaarten plaatsen we niet-essentiële cookies, maar
          alleen met jouw toestemming. Lees meer in ons{" "}
          <Link href="/cookies" className="text-terracotta-strong underline underline-offset-2">
            cookiebeleid
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={rejectAll}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-sand"
          >
            Alleen noodzakelijk
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="inline-flex h-10 items-center rounded-md bg-terracotta-strong px-4 text-sm font-medium text-cream hover:bg-terracotta"
          >
            Alles accepteren
          </button>
        </div>
      </div>
    </div>
  );
}
