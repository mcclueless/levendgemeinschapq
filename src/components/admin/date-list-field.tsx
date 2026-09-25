"use client";

import { useId, useRef, useState } from "react";
import { Input } from "@/components/admin/form";
import { DATES_FIELD } from "@/content/event-form";
import { MAX_EVENT_DATES } from "@/content/event-dates";

/**
 * An event's further dates (event-multiple-dates D7): one `datetime-local` row
 * per date, with add and remove. Each row posts as `dates`, read by
 * `datesFromForm`, which also sorts and de-duplicates — so rows need no order.
 *
 * Rendered on the server with its rows, so without JavaScript the dates already
 * present still submit and can be edited; only adding a row needs the button.
 *
 * Focus follows the change: a new row's input receives focus, and removing a row
 * moves focus to the next row, or to the add button when none is left, so a
 * keyboard user is never dropped at the top of the page.
 */
export function DateListField({ defaults = [] }: { defaults?: string[] }) {
  const baseId = useId();
  const nextKey = useRef(defaults.length);
  const [rows, setRows] = useState(() =>
    defaults.map((value, key) => ({ key, value })),
  );
  const inputs = useRef(new Map<number, HTMLInputElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  const focusKey = useRef<number | "add" | null>(null);

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
            return (
              <li key={row.key} className="flex items-center gap-2">
                <label htmlFor={id} className="sr-only">
                  Extra datum {i + 1}
                </label>
                <Input
                  ref={setInput(row.key)}
                  id={id}
                  name={DATES_FIELD}
                  type="datetime-local"
                  defaultValue={row.value}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => remove(row.key)}
                  className="h-10 shrink-0 rounded-md border border-border px-3 text-sm text-ink hover:bg-surface-2"
                >
                  Verwijderen<span className="sr-only"> extra datum {i + 1}</span>
                </button>
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
