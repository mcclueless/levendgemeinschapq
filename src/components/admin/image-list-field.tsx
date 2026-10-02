"use client";

import { useRef, useState, useTransition } from "react";
import { FORM_ERRORS } from "@/components/admin/form";
import { MediaPicker } from "@/components/admin/image-field";
import { uploadInlineImage } from "@/app/beheer/body-actions";
import type { MediaItem } from "@/content/media";

const button =
  "inline-flex h-8 items-center rounded-md border border-border bg-surface px-2.5 text-sm font-medium hover:bg-surface-2 disabled:opacity-40";

/**
 * An ordered list of images (organiser-page-layout D2): each row posts its URL
 * as `images`, in the order shown, and the first is the cover. Images are added
 * from the gallery or by uploading — the upload is stored at once, as in the
 * body editor — and can be removed or moved.
 *
 * Rendered on the server with its rows, so without JavaScript the stored images
 * still post unchanged; only changing the list needs scripts.
 */
export function ImageListField({
  pool: initialPool,
  defaults = [],
  label,
}: {
  pool: MediaItem[];
  defaults?: string[];
  /** Used in the buttons' accessible names, e.g. "Afbeelding". */
  label: string;
}) {
  const [images, setImages] = useState(defaults);
  const [pool, setPool] = useState(initialPool);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (url: string) => setImages((list) => (list.includes(url) ? list : [...list, url]));

  function move(i: number, by: -1 | 1) {
    setImages((list) => {
      const next = [...list];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.set("image", file);
    setMessage(undefined);
    startUpload(async () => {
      const result = await uploadInlineImage(data);
      if (fileRef.current) fileRef.current.value = "";
      if (!result.ok) {
        setMessage(FORM_ERRORS[result.reason] ?? "Uploaden is niet gelukt. Probeer het opnieuw.");
        return;
      }
      setPool((p) => [
        {
          url: result.url,
          key: result.url.split("/").slice(-2).join("/"),
          size: file.size,
          lastModified: new Date().toISOString(),
        },
        ...p,
      ]);
      add(result.url);
    });
  }

  return (
    <div className="grid gap-3">
      {images.length > 0 ? (
        <ol className="grid gap-2">
          {images.map((url, i) => (
            <li key={url} className="flex items-center gap-3 rounded-md border border-border bg-surface p-2">
              <input type="hidden" name="images" value={url} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
              <span className="flex-1 text-sm text-muted">
                {i === 0 ? "Omslag (eerste afbeelding)" : `Afbeelding ${i + 1}`}
              </span>
              <button
                type="button"
                className={button}
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={`${label} ${i + 1} naar voren`}
              >
                ↑
              </button>
              <button
                type="button"
                className={button}
                disabled={i === images.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`${label} ${i + 1} naar achteren`}
              >
                ↓
              </button>
              <button
                type="button"
                className={button}
                onClick={() => setImages((list) => list.filter((u) => u !== url))}
                aria-label={`${label} ${i + 1} verwijderen`}
              >
                Verwijderen
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted">Nog geen afbeeldingen.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* No name: the file is uploaded at once, never posted with the form. */}
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
        <button type="button" className={button} disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? "Bezig met uploaden…" : "Nieuwe afbeelding uploaden"}
        </button>
        <button type="button" className={button} onClick={() => setOpen(true)}>
          Kies uit galerij{pool.length ? ` (${pool.length})` : ""}
        </button>
      </div>
      {message ? (
        <p role="alert" className="text-sm text-brand-strong">
          {message}
        </p>
      ) : null}

      {open ? (
        <MediaPicker
          pool={pool}
          onPick={(url) => {
            add(url);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
