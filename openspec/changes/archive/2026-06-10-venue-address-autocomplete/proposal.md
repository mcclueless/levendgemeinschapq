## Why

Free-typing a venue address lets an editor save an impossible or typo'd address that the geocoder then **loosely matches to a wrong location with no warning** — reported in practice: an impossible address produced a random pin and no "niet gevonden" notice (because Nominatim returned a loose best-effort match, not "no match"). The fix is to let editors **pick a real, already-geocoded address from a type-ahead dropdown**: the coordinates come from the chosen place, and bad input simply has no plausible suggestion to select.

Provider: **Photon** (Komoot's OpenStreetMap geocoder) — free, no API key, purpose-built for autocomplete. A spike confirmed house-level Dutch results (`Grote Gracht 90, 6211SZ, Maastricht`) and live type-ahead from partial input.

## What Changes

- Add **address autocomplete** to the venue create/edit forms: as the editor types, suggestions appear; selecting one fills the address and **captures that location's exact coordinates**.
- Suggestions come from Photon via a small **server route** (`/beheer/api/address-suggest`, admin-only) that proxies the request with a Maastricht location bias — so there's no API key and no third-party call from the editor's browser.
- On save, a venue's coordinates use the **selected suggestion's** lat/lng; if the editor typed an address without selecting one, fall back to the existing Nominatim geocode-on-save (with its not-found notice).
- The public map display is **unchanged** (keyless Google embed from the stored coordinates).

## Capabilities

### Modified Capabilities
- `venues`: a venue's address is entered via **autocomplete**, and selecting a suggestion sets precise coordinates directly. Builds on the existing address-based location (geocode-on-save remains the fallback for un-selected free text).

## Non-goals

- **Google Places / any API key or billing.** Photon is free; this stays key-free.
- **Autocomplete for non-venue content** (only venues have a location).
- **In-form interactive map / click-to-pin.**
- **Changing the public map provider** — still the keyless Google embed.

## Impact

- **New:** `src/components/admin/address-autocomplete.tsx` (client, debounced, keyboard-accessible combobox) and `src/app/beheer/api/address-suggest/route.ts` (server proxy to Photon, admin-gated, location-biased, timeout). The venue create form and the venue branch of the edit form swap the plain address input for the autocomplete; `createVenue`/`updateVenue` read the selected coordinates.
- **External:** outbound to `photon.komoot.io` from our server (debounced, min query length, `limit`, identifying User-Agent) — fair-use friendly and not on the public site. **No new env var, no API key, no consent change** (it's a backend/editor feature).
- `geocode.ts` (Nominatim) **stays** as the save-time fallback for addresses typed without a selection. `lat`/`lng` schema unchanged.
