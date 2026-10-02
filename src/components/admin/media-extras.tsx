"use client";

import { useEffect, useState } from "react";

const button =
  "inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-2";

/**
 * Small script-only comforts for the gallery (gallery-find-and-describe D3,
 * D5). Each renders nothing until scripts run, so no control is offered that
 * could not work.
 */
function useEnhanced() {
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);
  return enhanced;
}

/** Ticks or unticks every image on the page; lives inside the grid's form. */
export function SelectAllButton() {
  const enhanced = useEnhanced();
  const [all, setAll] = useState(false);
  if (!enhanced) return null;
  return (
    <button
      type="button"
      className={button}
      onClick={(e) => {
        const next = !all;
        e.currentTarget.form
          ?.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="keys"]')
          .forEach((box) => (box.checked = next));
        setAll(next);
      }}
    >
      {all ? "Niets selecteren" : "Alles op deze pagina selecteren"}
    </button>
  );
}

/** Copies an image's full address. */
export function CopyAddressButton({ url }: { url: string }) {
  const enhanced = useEnhanced();
  const [copied, setCopied] = useState(false);
  if (!enhanced) return null;
  return (
    <button
      type="button"
      className={button}
      onClick={async () => {
        await navigator.clipboard.writeText(new URL(url, window.location.origin).toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      <span role="status">{copied ? "Gekopieerd" : "Adres kopiëren"}</span>
    </button>
  );
}

/**
 * An image's pixel dimensions, read from the loaded image: the store's listing
 * does not carry them. Shows a dash until known, and without scripts.
 */
export function ImageDimensions({ url }: { url: string }) {
  const [size, setSize] = useState<string>();
  useEffect(() => {
    const img = new Image();
    img.onload = () => setSize(`${img.naturalWidth} × ${img.naturalHeight} pixels`);
    img.src = url;
    return () => {
      img.onload = null;
    };
  }, [url]);
  return <>{size ?? "—"}</>;
}
