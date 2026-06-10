## Context

`venue-address-geocoding` made the address the single location input and geocodes it on save via Nominatim. But Nominatim is "best-effort": a garbage address still returns a loose match (the reported wrong-pin-with-no-warning). Free text + an always-answering geocoder = silent bad pins. The user chose **Photon autocomplete** so editors pick a real, pre-geocoded place instead of typing a string we then guess at.

Spike findings: Photon (`photon.komoot.io`, free, no key, CORS-enabled, built for type-ahead) returns house-level NL results and live partial-query suggestions. Ranking is *biased*, not bounded — without a city in the query it ranked the wrong region first — so location bias plus showing full labels (the editor picks the Maastricht entry) is how we keep it correct.

## Goals / Non-Goals

**Goal:** editors set a venue location by picking from address suggestions; the selection carries exact coordinates, eliminating typo'd/wrong pins.

**Non-goals:** Google/any key; non-venue autocomplete; in-form map/click-to-pin; changing the public map.

## Decisions

### D1 — Photon as the autocomplete provider
Free, no API key, designed for autocomplete. Nominatim's usage policy forbids autocomplete, so it stays only as the save-time geocode fallback.

### D2 — Server proxy route, not direct client calls
A `/beheer/api/address-suggest` route handler (checks `isAdmin`, 401 otherwise) proxies to Photon. This sets a proper User-Agent, applies the location bias server-side, keeps the provider swappable, and avoids any third-party request from the editor's browser. The client component fetches our route.

### D3 — Selection carries coordinates
Each suggestion holds `lat`/`lng`. Picking one sets the visible address text plus hidden `addrLat`/`addrLng` inputs. The save uses those directly — no re-geocode, exact pin.

### D4 — Save-time coordinate precedence
`createVenue`/`updateVenue` resolve venue coordinates as: **selected `addrLat`/`addrLng`** → else `geocode(address)` (existing Nominatim fallback) → else none. So editors who type without picking still get the current behaviour (and the "niet gevonden" notice); editors who pick get an exact pin. On edit with no result, existing coordinates are preserved (as today).

### D5 — Location bias, human-confirmed
Bias Photon with a Maastricht `lat`/`lon` (optionally a regional `bbox`). Because ranking isn't guaranteed, suggestions show the full label (street, postcode, city, country) so the editor selects the right one — the human pick is what actually prevents wrong pins.

### D6 — Map display unchanged
The public map stays the keyless Google embed rendering the stored coordinates; only the editor input changes.

## Risks / Trade-offs

- **Photon availability / rate limits** → debounce (~300 ms), min 3 chars, `limit=5`, short timeout. If Photon is down, the field still accepts free text and the save falls back to geocode-on-save. (Self-hosting Photon is a later option if needed.)
- **Imperfect ranking** (spike: missing city → wrong region first) → location bias + full labels + the editor's pick; encourage typing the town.
- **Attribution** → show "© OpenStreetMap" near the suggestions (OSM data).
- **Accessibility** → the combobox must be keyboard-navigable (↑/↓/Enter/Esc) with appropriate ARIA roles; the field must remain usable if JS/suggestions fail (plain text input + fallback geocode).

## Migration

None. Builds on the existing address + `lat`/`lng` fields; no schema or data change.
