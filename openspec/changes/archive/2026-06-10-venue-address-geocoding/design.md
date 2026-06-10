## Context

The venue map (`MapEmbed`) is the keyless Google embed: `https://maps.google.com/maps?q=<query>&output=embed`, where `<query>` is `"lat,lng"` if coordinates exist, else the address. So the map already works from an address alone. Coordinates were required by the form only because (a) editors wanted precise pins and (b) the seed addresses are fictional and don't geocode.

Spike result: Nominatim geocoded 5/5 real Maastricht addresses to building-level accuracy and returned no/loose matches only for the fictional seed addresses. That makes "type an address, derive coordinates" viable for free, and tells us a **graceful no-match path** is mandatory.

## Goals / Non-Goals

**Goal:** the editor sets a venue location by typing an address only; the system derives coordinates; the map is precise for real addresses and still works when geocoding can't resolve.

**Non-goals:** in-form interactive map / autocomplete; Google API key/billing; a manual coordinate-override field; geocoding non-venue content.

## Decisions

### D1 — Address is the single location input
Remove `lat`/`lng` from the venue forms. Coordinates become a **derived** value, not editor input. The schema keeps `lat`/`lng` (now system-set).

### D2 — Geocode on save via Nominatim
`createVenue`/`updateVenue` call `geocode(address)`; on a hit, store `lat`/`lng`. Geocoding runs once per save and the result is persisted, so there is **no per-view geocoding** (which also keeps us within Nominatim's usage policy). Free, no API key.

### D3 — Non-blocking and resilient
`geocode()` wraps the request in a timeout (~4s) and try/catch and returns `null` on no-match, error, or timeout. The save path treats `null` as "no coordinates this time":
- **Create:** store the address, no coordinates → map renders from the address.
- **Edit:** omit `lat`/`lng` from the merge patch so the **existing coordinates are preserved** (a transient Nominatim outage never wipes a good pin).
A geocoding problem must never fail the venue save.

### D4 — Usage-policy compliance
One request per save; a descriptive `User-Agent` identifying the app with a contact; `countrycodes=nl`, `accept-language=nl`, `limit=1` to bias and bound results; results cached as stored coordinates. All well inside Nominatim's fair-use terms for an occasionally-used backend.

### D5 — Editor feedback
The save action carries a geocode outcome in its redirect (e.g. `?geo=ok|notfound`); the destination page shows "Locatie gevonden" or "Locatie niet gevonden — de kaart gebruikt het adres." The spike's no-match cases make this confirmation genuinely useful — it lets the editor catch a mistyped or unresolvable address.

### D6 — No manual override in the UI
Coordinates stay in frontmatter and remain file-editable, but the form exposes no lat/lng. On edit, preserving existing coordinates when geocoding yields nothing (D3) covers the "don't lose my pin" case without a flag or extra field.

### D7 — Fix the seed addresses
Replace the three fictional seed venue addresses with real Maastricht addresses so their maps resolve under the new flow (and so the demo content isn't misleading).

## Risks / Trade-offs

- **Wrong top result for an ambiguous address** → mitigated by NL bias + the editor confirmation notice; the fix is to refine the address text.
- **Nominatim latency/downtime** → timeout + fallback to address-only; save unaffected; existing pins preserved on edit.
- **Re-geocoding on unrelated edits** → one cheap request per save; acceptable. (Could later skip when the address is unchanged — minor optimization, not needed now.)
- **A real address geocoding slightly differently than a previously hand-tuned pin** → acceptable: the address is now the source of truth, and the seed pins were placed for fictional addresses anyway.

## Migration

No structural migration. `lat`/`lng` remain in the schema. Seed venue addresses are updated to real ones; their coordinates will be (re)derived on next save or can be left as-is.
