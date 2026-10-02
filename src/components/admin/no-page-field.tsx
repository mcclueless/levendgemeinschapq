"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/admin/form";

/**
 * The "Geen pagina" choice on the event forms (event-no-page D5).
 *
 * Hiding the fields a marker never shows is CSS (`[data-page-only]` in
 * globals.css), so it works without scripts. With scripts, the start and
 * further-date inputs also become dates, since a marker has no time; the server
 * drops any time either way (D4).
 */
export function NoPageField({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <div className="grid gap-1">
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="noPage"
          defaultChecked={defaultChecked}
          className="h-4 w-4 rounded border-border"
        />
        Geen pagina
      </label>
      <p className="text-sm text-muted">
        Voor feestdagen, zomer- en wintertijd of het begin van een seizoen: alleen de afbeelding,
        datum en titel in de agenda, zonder eigen pagina en zonder tijd. Een afbeelding is dan
        verplicht.
      </p>
    </div>
  );
}

/**
 * Whether the form's "Geen pagina" box is checked, following changes.
 *
 * The date inputs render their `type` from this rather than having it changed
 * from outside: React re-applies an input's `type` prop on every input event,
 * so an externally switched input flipped back to `datetime-local` as soon as
 * the editor typed in it, and lost its date-only value.
 */
export function useMarkerMode(initial = false): boolean {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const box = document.querySelector<HTMLInputElement>('input[name="noPage"]');
    if (!box) return;
    const read = () => setOn(box.checked);
    read();
    box.addEventListener("change", read);
    return () => box.removeEventListener("change", read);
  }, []);
  return on;
}

/**
 * A date input's value in the current mode: the day alone for a marker, a
 * day-start time otherwise, so switching keeps the day the editor entered.
 */
export function valueForMode(value: string, marker: boolean): string {
  if (!value) return value;
  if (marker) return value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value;
}

/** The event's start field: a date for a marker, a date and time otherwise. */
export function EventStartInput({
  defaultValue = "",
  marker: initialMarker = false,
}: {
  defaultValue?: string;
  marker?: boolean;
}) {
  const marker = useMarkerMode(initialMarker);
  const [value, setValue] = useState(defaultValue);
  return (
    <Input
      id="start"
      name="start"
      type={marker ? "date" : "datetime-local"}
      required
      value={valueForMode(value, marker)}
      onChange={(e) => setValue(e.currentTarget.value)}
    />
  );
}
