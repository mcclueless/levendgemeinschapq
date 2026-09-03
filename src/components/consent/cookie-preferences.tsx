"use client";

import { useConsent } from "./consent-context";

/** Lets visitors review and change their cookie choice (on /cookies). */
export function CookiePreferences() {
  const { embeds, analytics, decided, acceptAll, rejectAll, setConsent } =
    useConsent();

  // Named per category rather than as one on/off: a visitor may reasonably
  // want the map without being measured, or the reverse.
  const allowed = [embeds ? "kaarten" : null, analytics ? "statistieken" : null]
    .filter(Boolean)
    .join(" + ");

  return (
    <div className="not-prose rounded-lg border border-border bg-surface p-6">
      <p className="text-sm text-muted">
        Huidige keuze:{" "}
        <strong className="text-ink">
          {!decided
            ? "nog niet gekozen"
            : allowed
              ? `noodzakelijk + ${allowed}`
              : "alleen noodzakelijke cookies"}
        </strong>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={rejectAll}
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
        >
          Alleen noodzakelijk
        </button>
        <button
          type="button"
          onClick={() => setConsent({ embeds: true })}
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
        >
          Kaarten toestaan
        </button>
        <button
          type="button"
          onClick={() => setConsent({ analytics: true })}
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
        >
          Statistieken toestaan
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="inline-flex h-10 items-center rounded-md bg-brand-strong px-4 text-sm font-medium text-white hover:bg-brand"
        >
          Alles accepteren
        </button>
      </div>
    </div>
  );
}
