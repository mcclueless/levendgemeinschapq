import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-server";

/**
 * Address autocomplete suggestions (venue-address-autocomplete). Proxies Photon
 * (Komoot's OpenStreetMap geocoder — free, no API key) so the User-Agent and
 * location bias live server-side and the editor's browser makes no third-party
 * call. Admin-only. Always returns an array (empty on error/timeout).
 */

export const dynamic = "force-dynamic";

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

interface PhotonProps {
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  country?: string;
}

const ENDPOINT = "https://photon.komoot.io/api/";
const USER_AGENT =
  "levende-gemeenschap/1.0 (+https://levendegemeenschap.nl; admin@levendegemeenschap.nl)";
// Bias suggestions toward Maastricht (ranking hint, not a hard bound).
const BIAS_LAT = "50.851";
const BIAS_LON = "5.69";

function buildLabel(p: PhotonProps): string {
  const street = p.street
    ? `${p.street}${p.housenumber ? ` ${p.housenumber}` : ""}`
    : undefined;
  const head = p.name && p.name !== p.street ? p.name : undefined;
  return [head, street, p.postcode, p.city, p.country].filter(Boolean).join(", ");
}

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json([] as Suggestion[]);

  const url = `${ENDPOINT}?${new URLSearchParams({
    q,
    limit: "5",
    lat: BIAS_LAT,
    lon: BIAS_LON,
  })}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) return NextResponse.json([] as Suggestion[]);
    const data: unknown = await res.json();
    const features =
      data && typeof data === "object" && Array.isArray((data as { features?: unknown }).features)
        ? ((data as { features: unknown[] }).features)
        : [];

    const out: Suggestion[] = [];
    for (const f of features) {
      const feat = f as { geometry?: { coordinates?: unknown }; properties?: PhotonProps };
      const c = feat.geometry?.coordinates;
      if (!Array.isArray(c) || c.length < 2) continue;
      const lng = Number(c[0]);
      const lat = Number(c[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const label = buildLabel(feat.properties ?? {});
      if (label) out.push({ label, lat, lng });
    }
    return NextResponse.json(out);
  } catch {
    return NextResponse.json([] as Suggestion[]);
  } finally {
    clearTimeout(timer);
  }
}
