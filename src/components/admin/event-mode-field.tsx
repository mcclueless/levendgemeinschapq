"use client";

import { useEffect, useState } from "react";
import { Field, Input } from "@/components/admin/form";
import type { EventMode } from "@/content/event-mode";

const MODES: { value: EventMode; label: string; hint: string }[] = [
  {
    value: "page",
    label: "Een eigen pagina op Goeddoen",
    hint: "Het hele evenement staat op Goeddoen, met tekst, locatie en organisator.",
  },
  {
    value: "external",
    label: "De eigen website van de organisatie",
    hint: "In de agenda staat het evenement als gewoon evenement, maar de link opent de pagina van de organisatie in een nieuw tabblad. Een afbeelding en een webadres zijn verplicht.",
  },
  {
    value: "marker",
    label: "Geen pagina",
    hint: "Voor feestdagen, zomer- en wintertijd of het begin van een seizoen: alleen de afbeelding, datum en titel in de agenda, zonder eigen pagina en zonder tijd. Een afbeelding is dan verplicht.",
  },
];

/**
 * Where an event leads (event-external-link D4): one choice of three, which
 * replaces the "Geen pagina" checkbox of event-no-page.
 *
 * Hiding the fields a mode never shows is CSS (`[data-page-only]`,
 * `[data-page-text]` and `[data-external-only]` in globals.css), so it works
 * without scripts. With scripts, the start and further-date inputs also become
 * dates for a marker, which has no time; the server drops any time either way.
 */
export function EventModeField({
  defaultMode = "page",
  defaultUrl,
}: {
  defaultMode?: EventMode;
  defaultUrl?: string;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium text-ink">
        Waar leidt dit evenement naartoe?
      </legend>
      {MODES.map((mode) => (
        <div key={mode.value} className="grid gap-1">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="mode"
              value={mode.value}
              defaultChecked={mode.value === defaultMode}
              className="h-4 w-4 border-border"
            />
            {mode.label}
          </label>
          <p className="pl-6 text-sm text-muted">{mode.hint}</p>
        </div>
      ))}
      <div data-external-only className="pl-6">
        <Field
          label="Webadres van de organisatie"
          htmlFor="externalUrl"
          hint="Volledig adres, beginnend met https://."
        >
          <Input
            id="externalUrl"
            name="externalUrl"
            type="url"
            inputMode="url"
            placeholder="https://"
            defaultValue={defaultUrl}
          />
        </Field>
      </div>
    </fieldset>
  );
}

/**
 * Whether the form's mode choice is "Geen pagina", following changes.
 *
 * The date inputs render their `type` from this rather than having it changed
 * from outside: React re-applies an input's `type` prop on every input event,
 * so an externally switched input flipped back to `datetime-local` as soon as
 * the editor typed in it, and lost its date-only value.
 */
export function useMarkerMode(initial = false): boolean {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const radios = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="mode"]'),
    );
    if (radios.length === 0) return;
    const read = () => setOn(radios.some((r) => r.checked && r.value === "marker"));
    read();
    for (const radio of radios) radio.addEventListener("change", read);
    return () => {
      for (const radio of radios) radio.removeEventListener("change", read);
    };
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
