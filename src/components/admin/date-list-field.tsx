"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/admin/form";
import { useMarkerMode, valueForMode } from "@/components/admin/event-mode-field";
import { DATES_FIELD } from "@/content/event-form";
import { MAX_EVENT_DATES, previewDateEnd } from "@/content/event-dates";

/**
 * An event's further dates (event-multiple-dates D7): one `datetime-local` row
 * per date (a `date` row for an agenda marker, event-no-page D5), with add and remove. Each row posts as `dates`, read by
 * `datesFromForm`, which also sorts and de-duplicates — so rows need no order.
 *
 * Rendered on the server with its rows, so without JavaScript the dates already
 * present still submit and can be edited; only adding a row needs the button.
 *
 * Focus follows the change: a new row's input receives focus, and removing a row
 * moves focus to the next row, or to the add button when none is left, so a
 * keyboard user is never dropped at the top of the page.
 *
 * Each row shows the end its date will receive ("tot 22:00"), derived from the
 * form's own start and end fields by the rule the server applies
 * (event-date-end-times D3). It follows edits to those fields and to the row.
 * It is described text on the row's input, not a live region, so it is read
 * with the field rather than announced on every keystroke.
 */
export function DateListField({
  defaults = [],
  marker: initialMarker = false,
}: {
  defaults?: string[];
  marker?: boolean;
}) {
  const baseId = useId();
  // An agenda marker's dates have no time (event-no-page D5).
  const marker = useMarkerMode(initialMarker);
  const nextKey = useRef(defaults.length);
  const [rows, setRows] = useState(() =>
    defaults.map((value, key) => ({ key, value })),
  );
  const inputs = useRef(new Map<number, HTMLInputElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  const focusKey = useRef<number | "add" | null>(null);

  // The event's own start and end, read from the form's fields by id.
  const [eventTimes, setEventTimes] = useState<{ start?: string; end?: string }>({});
  useEffect(() => {
    const start = document.getElementById("start") as HTMLInputElement | null;
    const end = document.getElementById("end") as HTMLInputElement | null;
    const read = () => setEventTimes({ start: start?.value, end: end?.value });
    read();
    for (const el of [start, end]) {
      el?.addEventListener("input", read);
      el?.addEventListener("change", read);
    }
    return () => {
      for (const el of [start, end]) {
        el?.removeEventListener("input", read);
        el?.removeEventListener("change", read);
      }
    };
  }, []);

  const setValue = (key: number, value: string) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, value } : row)));

  const setInput = (key: number) => (el: HTMLInputElement | null) => {
    if (el) inputs.current.set(key, el);
    else inputs.current.delete(key);
    if (el && focusKey.current === key) {
      focusKey.current = null;
      el.focus();
    }
  };

  function add() {
    const key = nextKey.current++;
    focusKey.current = key;
    setRows((r) => [...r, { key, value: "" }]);
  }

  function remove(key: number) {
    const i = rows.findIndex((r) => r.key === key);
    const next = rows[i + 1] ?? rows[i - 1];
    setRows((r) => r.filter((row) => row.key !== key));
    if (next) inputs.current.get(next.key)?.focus();
    else addButton.current?.focus();
  }

  const hintId = `${baseId}-hint`;

  return (
    <fieldset className="grid gap-3 rounded-md border border-border p-4" aria-describedby={hintId}>
      <legend className="px-1 text-sm font-medium text-ink">Extra data (optioneel)</legend>
      <p id={hintId} className="text-xs text-muted">
        Voor een reeks op losse data, zoals drie concerten. Elke datum duurt even lang als de
        eerste. Een evenement herhaalt zich óf heeft extra data: kies bij Herhaling dan
        ‘Eenmalig’. Hoogstens {MAX_EVENT_DATES}.
      </p>
      {rows.length > 0 ? (
        <ul className="grid gap-2">
          {rows.map((row, i) => {
            const id = `${baseId}-date-${row.key}`;
            const endId = `${id}-end`;
            const end = previewDateEnd(row.value, eventTimes.start, eventTimes.end);
            return (
              <li key={row.key} className="grid gap-1">
                <div className="flex items-center gap-2">
                  <label htmlFor={id} className="sr-only">
                    Extra datum {i + 1}
                  </label>
                  <Input
                    ref={setInput(row.key)}
                    id={id}
                    name={DATES_FIELD}
                    type={marker ? "date" : "datetime-local"}
                    value={valueForMode(row.value, marker)}
                    onChange={(e) => setValue(row.key, e.currentTarget.value)}
                    aria-describedby={end ? endId : undefined}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => remove(row.key)}
                    className="h-10 shrink-0 rounded-md border border-border px-3 text-sm text-ink hover:bg-surface-2"
                  >
                    Verwijderen<span className="sr-only"> extra datum {i + 1}</span>
                  </button>
                </div>
                {end ? (
                  <p id={endId} className="text-xs text-muted">
                    tot {end}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {rows.length < MAX_EVENT_DATES ? (
        <div>
          <button
            ref={addButton}
            type="button"
            onClick={add}
            className="h-10 rounded-md border border-border px-3 text-sm font-medium text-ink hover:bg-surface-2"
          >
            + Datum toevoegen
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}
