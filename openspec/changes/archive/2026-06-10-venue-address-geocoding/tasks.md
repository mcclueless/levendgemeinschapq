## 1. Geocoding helper

- [x] 1.1 Add server-only `src/content/geocode.ts` with `geocode(address: string): Promise<{ lat: number; lng: number; displayName: string } | null>` — calls Nominatim `search` (`format=json`, `limit=1`, `countrycodes=nl`, `accept-language=nl`), with a descriptive `User-Agent`, an ~4s timeout (AbortController), and try/catch returning `null` on no-match/error/timeout

## 2. Geocode on save

- [x] 2.1 `createVenue`: after validating, `geocode(address)`; store `lat`/`lng` from the hit (omit when null); redirect with a geocode-outcome flag
- [x] 2.2 `updateVenue`: same, but on `null` omit `lat`/`lng` from the merge patch so existing coordinates are preserved; stop reading `lat`/`lng` from the form
- [x] 2.3 Ensure a geocode failure/timeout never throws out of the save (the venue still persists)

## 3. Forms

- [x] 3.1 `nieuw/locatie`: remove the latitude/longitude fields; keep "Adres" with a hint that the location is determined automatically
- [x] 3.2 Venue branch of `beheer/[type]/[slug]/bewerken`: remove the latitude/longitude fields (keep "Adres")

## 4. Editor feedback

- [x] 4.1 Surface the geocode outcome after save — "Locatie gevonden" / "Locatie niet gevonden — de kaart gebruikt het adres" — on the create redirect target and the venue list

## 5. Seed content

- [x] 5.1 Replace the 3 fictional seed venue addresses (`de-brink`, `t-anker`, `werkplaats-noord`) with real Maastricht addresses

## 6. Verify

- [x] 6.1 Create a venue with a real address → coordinates stored, map centered on it; `pnpm typecheck` / `lint` / `build` pass
- [ ] 6.2 Save a venue with an unresolvable address → save succeeds, address stored, "niet gevonden" notice shown, public map still renders from the address
- [ ] 6.3 Edit a venue while geocoding returns nothing → existing coordinates preserved
- [ ] 6.4 On deploy: confirm the SSR runtime can reach Nominatim and a real address geocodes live
