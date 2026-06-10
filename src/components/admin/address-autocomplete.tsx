"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Address field with Photon-backed autocomplete (venue-address-autocomplete).
 * The visible input submits the address text under `name`; selecting a
 * suggestion also fills hidden `addrLat`/`addrLng` so the save stores exact
 * coordinates. Typing after a selection clears those coords (no stale pin).
 * Degrades to a plain text field if suggestions can't be fetched.
 */

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

const control =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-1";

export function AddressAutocomplete({
  name = "address",
  id,
  defaultValue = "",
}: {
  name?: string;
  id?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const skipNextFetch = useRef(false);
  const listId = useId();

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/beheer/api/address-suggest?q=${encodeURIComponent(q)}`,
        );
        if (!res.ok) return;
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
        setActive(-1);
      } catch {
        /* leave the field usable as plain text */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [value]);

  function pick(s: Suggestion) {
    skipNextFetch.current = true; // selecting shouldn't trigger a new query
    setValue(s.label);
    setCoords({ lat: s.lat, lng: s.lng });
    setSuggestions([]);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input type="hidden" name="addrLat" value={coords?.lat ?? ""} />
      <input type="hidden" name="addrLng" value={coords?.lng ?? ""} />
      <input
        id={id ?? name}
        name={name}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setCoords(null); // typing invalidates a prior selection
        }}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={control}
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-card"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.lat},${s.lng},${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // select before the input blurs
                  pick(s);
                }}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm",
                  i === active ? "bg-sand" : "hover:bg-sand",
                )}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-1 text-xs text-muted">
        Begin te typen en kies een suggestie voor een nauwkeurige kaartpositie.
        Adresgegevens via © OpenStreetMap.
      </p>
    </div>
  );
}
