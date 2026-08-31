import "server-only";

/**
 * Address → coordinates via OpenStreetMap's Nominatim (venue-address-geocoding).
 * Free, no API key. Called once per venue save and the result is persisted as
 * stored coordinates, so there is no per-view geocoding — keeping us within
 * Nominatim's usage policy. Always resolves: returns null on no-match, error,
 * or timeout so a geocoding hiccup never fails a save.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
// Identifies the app per Nominatim's policy; contact is the site admin.
const USER_AGENT =
  "levende-gemeenschap/1.0 (+https://goeddoen.net; info@goeddoen.net)";
const TIMEOUT_MS = 4000;

export async function geocode(address: string): Promise<GeocodeResult | null> {
  const q = address.trim();
  if (!q) return null;

  const url = `${ENDPOINT}?${new URLSearchParams({
    q,
    format: "json",
    limit: "1",
    countrycodes: "nl",
    "accept-language": "nl",
  })}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const hit = data[0] as { lat?: string; lon?: string; display_name?: string };
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, displayName: hit.display_name ?? q };
  } catch {
    return null; // network error / timeout / abort
  } finally {
    clearTimeout(timer);
  }
}
