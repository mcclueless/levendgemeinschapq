"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  imageMarkdown,
  insertBlock,
  insertLink,
  prefixLines,
  wrapInline,
  type LinePrefix,
  type Replacement,
} from "@/lib/body-format";
import { MediaPicker } from "@/components/admin/image-field";
import { FORM_ERRORS } from "@/components/admin/form";
import { previewBody, uploadInlineImage } from "@/app/beheer/body-actions";
import type { MediaItem } from "@/content/media";

/**
 * The body field of every backend content form, with a Markdown toolbar, an
 * image control and a preview (body-editor-toolbar D1–D5).
 *
 * It enhances a plain `<textarea name="body">`, rendered on the server with its
 * value: without JavaScript it is exactly the field it replaces. The textarea
 * stays uncontrolled; the toolbar edits it through the DOM, so the form posts
 * whatever it holds.
 */
export function BodyEditor({
  defaultValue,
  pool,
  className,
}: {
  defaultValue?: string;
  pool: MediaItem[];
  className?: string;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const imageButton = useRef<HTMLButtonElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<ReactNode>(null);
  const [loading, startPreview] = useTransition();
  const [imageOpen, setImageOpen] = useState(false);
  // The toolbar only works with JavaScript, so it appears once the page is
  // interactive; before that, and without scripts, this is a plain text field.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // Back from the preview, return focus to the text once it is visible again.
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!previewing && returnFocus.current) {
      returnFocus.current = false;
      area.current?.focus();
    }
  }, [previewing]);

  /**
   * Apply a replacement. `insertText` keeps the browser's undo history, which a
   * direct value change wipes in some browsers; where it is unavailable or does
   * not produce the expected text, fall back to `setRangeText`.
   */
  function apply(r: Replacement) {
    const el = area.current;
    if (!el) return;
    const expected = el.value.slice(0, r.from) + r.insert + el.value.slice(r.to);
    el.focus();
    el.setSelectionRange(r.from, r.to);
    let done = false;
    try {
      done = document.execCommand("insertText", false, r.insert);
    } catch {
      done = false;
    }
    if (!done || el.value !== expected) {
      el.value = expected;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    el.setSelectionRange(r.from + r.selectStart, r.from + r.selectEnd);
  }

  const withSelection = (fn: (text: string, start: number, end: number) => Replacement) => () => {
    const el = area.current;
    if (el) apply(fn(el.value, el.selectionStart, el.selectionEnd));
  };

  const bold = withSelection((t, s, e) => wrapInline(t, s, e, "**", "tekst"));
  const italic = withSelection((t, s, e) => wrapInline(t, s, e, "*", "tekst"));
  const lines = (kind: LinePrefix) => withSelection((t, s, e) => prefixLines(t, s, e, kind));
  const link = withSelection(insertLink);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      bold();
    } else if (key === "i") {
      e.preventDefault();
      italic();
    }
  }

  function togglePreview() {
    if (previewing) {
      returnFocus.current = true;
      setPreviewing(false);
      setPreview(null);
      return;
    }
    const source = area.current?.value ?? "";
    setPreviewing(true);
    startPreview(async () => {
      const result = await previewBody(source);
      setPreview(
        result.ok ? (
          result.node
        ) : (
          <div role="alert" className="rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong">
            <p className="font-medium">Deze tekst kan niet worden weergegeven.</p>
            <p className="mt-1 break-words text-xs">{result.error}</p>
          </div>
        ),
      );
    });
  }

  function insertImage(url: string, description: string) {
    setImageOpen(false);
    const el = area.current;
    if (!el) return;
    apply(insertBlock(el.value, el.selectionStart, el.selectionEnd, imageMarkdown(description, url)));
  }

  const tool =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border bg-surface px-2.5 text-sm text-ink hover:bg-surface-2 disabled:opacity-50";

  return (
    <div className="grid gap-2">
      {ready ? (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="toolbar" aria-label="Opmaak" aria-controls="body" className="flex flex-wrap gap-1.5">
          <button type="button" className={cn(tool, "font-bold")} onClick={bold} disabled={previewing} aria-label="Vet" title="Vet (Ctrl/Cmd+B)">
            B
          </button>
          <button type="button" className={cn(tool, "italic")} onClick={italic} disabled={previewing} aria-label="Cursief" title="Cursief (Ctrl/Cmd+I)">
            I
          </button>
          <button type="button" className={tool} onClick={lines("heading")} disabled={previewing}>
            Kop
          </button>
          <button type="button" className={tool} onClick={lines("bullet")} disabled={previewing}>
            Opsomming
          </button>
          <button type="button" className={tool} onClick={lines("numbered")} disabled={previewing}>
            Nummering
          </button>
          <button type="button" className={tool} onClick={link} disabled={previewing}>
            Link
          </button>
          <button
            ref={imageButton}
            type="button"
            className={tool}
            onClick={() => setImageOpen(true)}
            disabled={previewing}
          >
            Afbeelding
          </button>
        </div>
        <button type="button" className={tool} aria-pressed={previewing} onClick={togglePreview}>
          {previewing ? "Terug naar bewerken" : "Voorbeeld tonen"}
        </button>
      </div>
      ) : null}

      <textarea
        ref={area}
        id="body"
        name="body"
        defaultValue={defaultValue}
        onKeyDown={onKeyDown}
        hidden={previewing}
        className={cn(
          "min-h-32 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-1",
          className,
        )}
      />

      {previewing ? (
        <div
          role="region"
          aria-label="Voorbeeld"
          aria-busy={loading}
          className="min-h-32 rounded-md border border-dashed border-border bg-canvas px-4 py-3"
        >
          {loading ? <p className="text-sm text-muted">Voorbeeld laden…</p> : preview}
        </div>
      ) : null}

      {imageOpen ? (
        <ImageDialog
          pool={pool}
          onInsert={insertImage}
          onClose={() => {
            setImageOpen(false);
            requestAnimationFrame(() => imageButton.current?.focus());
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Pick an image from the library or upload one, describe it, and insert it
 * (body-editor-toolbar D3, D4). Its inputs carry no `name`, so nothing here is
 * submitted with the surrounding content form.
 */
function ImageDialog({
  pool: initialPool,
  onInsert,
  onClose,
}: {
  pool: MediaItem[];
  onInsert: (url: string, description: string) => void;
  onClose: () => void;
}) {
  const [pool, setPool] = useState(initialPool);
  const [selected, setSelected] = useState<string>();
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string>();
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

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
      const item: MediaItem = {
        url: result.url,
        key: result.url.split("/").slice(-2).join("/"),
        size: file.size,
        lastModified: new Date().toISOString(),
      };
      setPool((p) => [item, ...p]);
      setSelected(result.url);
      descriptionRef.current?.focus();
    });
  }

  function confirm() {
    if (!selected) {
      setMessage("Kies eerst een afbeelding, of upload een nieuwe.");
      return;
    }
    if (!description.trim()) {
      setMessage("Geef een korte beschrijving van de afbeelding, voor wie de afbeelding niet kan zien.");
      descriptionRef.current?.focus();
      return;
    }
    onInsert(selected, description);
  }

  return (
    <MediaPicker
      pool={pool}
      selected={selected}
      onPick={(url) => {
        setSelected(url);
        setMessage(undefined);
      }}
      onClose={onClose}
      title="Afbeelding invoegen"
      label="Afbeelding invoegen in de tekst"
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
          >
            {uploading ? "Uploaden…" : "Nieuwe afbeelding uploaden"}
          </button>
          <span className="text-xs text-muted">
            {selected ? "Afbeelding gekozen." : "Of kies hierboven een afbeelding uit de galerij."}
          </span>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="body-image-description" className="text-sm font-medium text-ink">
            Beschrijving (voor schermlezers)<span className="text-brand-strong"> *</span>
          </label>
          <input
            ref={descriptionRef}
            id="body-image-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              // Enter here must insert the image, not submit the content form.
              if (e.key === "Enter") {
                e.preventDefault();
                confirm();
              }
            }}
            aria-required="true"
            aria-describedby={message ? "body-image-message" : undefined}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-1"
          />
        </div>
        {message ? (
          <p id="body-image-message" role="alert" className="text-sm text-brand-strong">
            {message}
          </p>
        ) : null}
        <div>
          <button
            type="button"
            onClick={confirm}
            disabled={uploading}
            className="inline-flex h-10 items-center rounded-md bg-brand-strong px-4 font-medium text-white hover:bg-brand disabled:opacity-50"
          >
            Invoegen
          </button>
        </div>
      </div>
    </MediaPicker>
  );
}
