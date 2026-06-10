## 1. Suggestion endpoint

- [x] 1.1 Add `src/app/beheer/api/address-suggest/route.ts` (GET): guard with `isAdmin()` (401 otherwise); read `q` (ignore < 3 chars); query Photon (`q`, `limit=5`, Maastricht `lat`/`lon` bias, identifying `User-Agent`, ~4s timeout); map the GeoJSON features to `[{ label, lat, lng }]`; return JSON; return `[]` on error/timeout

## 2. Autocomplete component

- [x] 2.1 Add client `<AddressAutocomplete name="address" defaultValue>` — debounced (~300 ms) fetch to the suggest route, results dropdown, ARIA combobox with ↑/↓/Enter/Esc keyboard navigation
- [x] 2.2 On select: set the visible address input value + hidden `addrLat`/`addrLng`; typing again (without re-selecting) clears the hidden coords so stale coordinates aren't submitted; free text without a selection is allowed
- [x] 2.3 Show an "© OpenStreetMap" attribution note near the field

## 3. Forms

- [x] 3.1 Venue create form (`nieuw/locatie`): replace the address `Input` with `<AddressAutocomplete>`
- [x] 3.2 Venue edit branch (`beheer/[type]/[slug]/bewerken`): same, seeded with the venue's current address

## 4. Actions

- [x] 4.1 `createVenue`/`updateVenue`: resolve coordinates as selected `addrLat`/`addrLng` ?? `geocode(address)` ?? none; keep the not-found redirect flag for the geocode-fallback path; on edit with no result, preserve existing coordinates

## 5. Verify

- [x] 5.1 Type a partial Maastricht address → suggestions appear; pick one → exact coordinates stored on save; `pnpm typecheck` / `lint` / `build` pass
- [x] 5.2 Type an impossible address and don't pick → no plausible suggestion; saving as free text falls back to geocode-on-save (notice as before)
- [x] 5.3 Keyboard-only operation works (navigate + select + escape); field still works if suggestions fail
- [ ] 5.4 On deploy: suggestions load on live (SSR route reaches Photon) and a picked address pins correctly
