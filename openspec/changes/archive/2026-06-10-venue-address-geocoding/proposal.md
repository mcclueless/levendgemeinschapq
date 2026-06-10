## Why

Setting a venue's location requires hand-entering **latitude and longitude** — editors must look coordinates up elsewhere, which is cumbersome. Yet coordinates are largely redundant: the map embed is the **keyless** Google embed (`q=<query>&output=embed`), which geocodes a plain address string, and the venue page already **falls back to the address** when coordinates are absent. The coordinate fields only exist for pin-precision (and because the fictional seed addresses don't geocode).

A spike confirmed **Nominatim** (OpenStreetMap's geocoder — free, no API key, no billing) resolves real Maastricht addresses to building-level coordinates reliably (5/5 real addresses; the only misses were the fictional seed addresses). So we can make **address the single location input** and derive coordinates automatically on save.

## What Changes

- **Venue create/edit forms drop the latitude/longitude fields.** "Adres" becomes the single location input.
- **Geocode on save:** `createVenue` / `updateVenue` geocode the address via Nominatim and store the resulting `lat`/`lng`. If the address can't be resolved (or Nominatim is unavailable), the venue still saves with its address and the map renders from the address — geocoding **never blocks or fails a save**.
- **Editor feedback:** after saving, inform the editor whether the location was found ("Locatie gevonden") or not ("Locatie niet gevonden — de kaart gebruikt het adres").
- **New server-only `geocode()` helper** (Nominatim, NL-biased, descriptive User-Agent, timeout, graceful failure) — results are persisted as stored coordinates, so there is no per-view geocoding.
- **Fix the 3 fictional seed venue addresses** to real Maastricht addresses so their maps resolve.
- **Scope: venues only** — the only content type with an address and a map.

## Capabilities

### Modified Capabilities
- `venues`: a venue's location is entered as an **address** and map coordinates are **derived automatically** (geocoding); manual latitude/longitude entry is no longer required.

## Non-goals

- **Interactive map / address autocomplete / click-to-pin** in the form. This is deliberately the no-JS, no-key path; a richer picker is a possible later upgrade.
- **Google Maps Platform API key / billing.** The display stays the keyless embed; geocoding uses free Nominatim.
- **A manual coordinate-override field in the UI.** Coordinates remain in frontmatter (now system-set) and are still editable in the file if ever truly needed.
- **Geocoding for other content types.** Only venues have a location/map.

## Impact

- **Affected code:** new `src/content/geocode.ts`; `createVenue` / `updateVenue` in `src/app/beheer/actions.ts`; the venue create form (`nieuw/locatie`) and the venue branch of the edit form (remove two fields); a small editor-feedback notice; and the 3 seed venue addresses.
- **No schema change** — `lat`/`lng` stay on the venue (now populated by geocoding). **No new env var, no API key, no consent change** (geocoding is a server-side call; the public map embed stays consent-gated exactly as today).
- **External dependency:** an outbound HTTPS call to `nominatim.openstreetmap.org` at save time. Compliant with its usage policy by design — one request per save, a valid identifying User-Agent, and results cached as stored coordinates (no per-render calls). The save is resilient to Nominatim downtime (failure → address-only).
