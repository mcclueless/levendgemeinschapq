"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/content/media";

/**
 * Cover-image field (cover-image-bank): set a cover by uploading a new file
 * (existing `image` input) or picking one from the pool of already-uploaded
 * images (sets a hidden `featuredImageUrl`). The action resolves
 * `featuredImageUrl ?? saveUpload(image) ?? existing`.
 */
export function ImageField({
  pool,
  current,
  hint,
}: {
  pool: MediaItem[];
  current?: string;
  hint?: string;
}) {
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Precedence mirrors the server action: a bank pick, else a freshly chosen
  // file, else the item's existing cover.
  const preview = picked ?? filePreview ?? current;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPicked(undefined); // a new upload supersedes a bank pick
    setFileName(f?.name);
    setFilePreview(f ? URL.createObjectURL(f) : undefined);
  }

  function choose(url: string) {
    setPicked(url);
    setFilePreview(undefined);
    setFileName(undefined);
    if (fileRef.current) fileRef.current.value = ""; // pick wins over any file
    setOpen(false);
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name="featuredImageUrl" value={picked ?? ""} />

      <div className="flex items-start gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="h-24 w-32 shrink-0 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-center text-xs text-muted">
            Geen afbeelding
          </div>
        )}

        <div className="grid gap-2">
          {/* Native file input is visually hidden and driven by the styled
              button below, so the control matches "Kies uit galerij" instead of
              the unstyleable browser "Choose file" chrome (design D1). */}
          <input
            ref={fileRef}
            id="image"
            type="file"
            name="image"
            accept="image/*"
            onChange={onFile}
            className="sr-only"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-9 w-fit items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-2"
            >
              Bestand kiezen
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-9 w-fit items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-2"
            >
              Kies uit galerij{pool.length ? ` (${pool.length})` : ""}
            </button>
          </div>
          <p className="text-xs text-muted">
            {fileName ?? "Geen bestand gekozen"}
          </p>
        </div>
      </div>

      {hint ? <p className="text-xs text-muted">{hint}</p> : null}

      {open ? (
        <MediaPicker
          pool={pool}
          selected={picked}
          onPick={choose}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function MediaPicker({
  pool,
  selected,
  onPick,
  onClose,
}: {
  pool: MediaItem[];
  selected?: string;
  onPick: (url: string) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kies een afbeelding uit de galerij"
        className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-lg">Galerij</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-sm px-3 py-1.5 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
          >
            Sluiten
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {pool.length === 0 ? (
            <p className="text-muted">
              Nog geen afbeeldingen geüpload. Upload er een via “Nieuwe afbeelding”.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {pool.map((m) => (
                <li key={m.key}>
                  <button
                    type="button"
                    onClick={() => onPick(m.url)}
                    className={`block w-full overflow-hidden rounded-md border-2 ${
                      selected === m.url ? "border-brand-strong" : "border-border"
                    } hover:border-brand-strong`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt=""
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
