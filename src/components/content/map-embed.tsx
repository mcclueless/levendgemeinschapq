"use client";

import { useConsent } from "@/components/consent/consent-context";

/**
 * Consent-gated Google Map (design D8). Until the visitor consents to
 * non-essential embeds, we render a placeholder with an explicit opt-in rather
 * than loading any Google resources.
 */
export function MapEmbed({
  query,
  label,
}: {
  /** Address or "lat,lng" used to locate the venue. */
  query: string;
  label: string;
}) {
  const { embeds, setConsent } = useConsent();

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    query,
  )}&z=15&output=embed`;

  if (!embeds) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface-2 px-6 py-12 text-center">
        <p className="max-w-sm text-sm text-muted">
          De kaart wordt geladen via Google Maps. Daarvoor plaatsen we
          niet-essentiële cookies. Geef toestemming om de kaart te tonen.
        </p>
        <button
          type="button"
          onClick={() => setConsent({ embeds: true })}
          className="inline-flex h-10 items-center rounded-md bg-brand-strong px-4 text-sm font-medium text-white hover:bg-brand"
        >
          Kaart tonen
        </button>
      </div>
    );
  }

  return (
    <iframe
      title={`Kaart: ${label}`}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="h-72 w-full rounded-lg border border-border"
    />
  );
}
