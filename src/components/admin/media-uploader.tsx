"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FORM_ERRORS, SubmitButton } from "@/components/admin/form";
import { uploadMedia } from "@/app/beheer/actions";
import { uploadInlineImage } from "@/app/beheer/body-actions";
import { cn } from "@/lib/cn";

interface FileResult {
  name: string;
  /** Absent while the file is still being sent. */
  ok?: boolean;
  message?: string;
}

/**
 * The gallery's upload control (gallery-find-and-describe D4).
 *
 * Rendered as a plain single-file form, which is what works without JavaScript:
 * several files in one form post would exceed the request limit with two
 * ordinary phone photos. Once scripts run it accepts several files, chosen or
 * dropped, and sends each in its own request, so one file's rejection does not
 * stop the others and each reports its own result.
 */
export function MediaUploader({ terug }: { terug: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);

  useEffect(() => setEnhanced(true), []);

  async function send(files: File[]) {
    if (files.length === 0 || busy) return;
    setBusy(true);
    setResults(files.map((f) => ({ name: f.name })));
    for (const [i, file] of files.entries()) {
      const data = new FormData();
      data.set("image", file);
      let result: FileResult;
      try {
        const sent = await uploadInlineImage(data);
        result = sent.ok
          ? { name: file.name, ok: true }
          : {
              name: file.name,
              ok: false,
              message: FORM_ERRORS[sent.reason] ?? "Uploaden is niet gelukt. Probeer het opnieuw.",
            };
      } catch {
        // A file over the request limit never reaches the action.
        result = { name: file.name, ok: false, message: FORM_ERRORS["upload-size"] };
      }
      setResults((list) => list.map((r, at) => (at === i ? result : r)));
    }
    if (inputRef.current) inputRef.current.value = "";
    setBusy(false);
    router.refresh();
  }

  const done = results.filter((r) => r.ok !== undefined).length;

  return (
    <form
      action={uploadMedia}
      onSubmit={enhanced ? (e) => e.preventDefault() : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void send([...e.dataTransfer.files]);
      }}
      className={cn(
        "mt-8 rounded-lg border-2 border-dashed p-5",
        over ? "border-brand bg-brand/10" : "border-border",
      )}
    >
      <input type="hidden" name="terug" value={terug} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="image" className="text-sm font-medium text-ink">
            {enhanced ? "Nieuwe afbeeldingen" : "Nieuwe afbeelding"}
          </label>
          <input
            ref={inputRef}
            id="image"
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
            multiple={enhanced}
            required={!enhanced}
            disabled={busy}
            onChange={(e) => void send([...(e.target.files ?? [])])}
            className="text-sm"
          />
        </div>
        {enhanced ? null : <SubmitButton>Uploaden</SubmitButton>}
      </div>
      {enhanced ? (
        <p className="mt-2 text-sm text-muted">
          Kies een of meer afbeeldingen, of sleep ze hierheen. Maximaal 10 MB per afbeelding.
        </p>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-4" role="status" aria-live="polite">
          <p className="text-sm font-medium text-ink">
            {busy
              ? `Bezig met uploaden… ${done} van ${results.length}`
              : `${results.filter((r) => r.ok).length} van ${results.length} geüpload.`}
          </p>
          <ul className="mt-2 grid gap-1 text-sm">
            {results.map((r, i) => (
              <li key={`${r.name}-${i}`} className={r.ok === false ? "text-brand-strong" : "text-muted"}>
                <span className="font-medium">{r.name}</span>
                {r.ok === undefined ? " — wacht…" : r.ok ? " — geüpload" : ` — niet geüpload. ${r.message}`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
