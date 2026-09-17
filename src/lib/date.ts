/**
 * Date helpers. The site operates in a fixed timezone for event logic
 * (design risk note: Europe/Amsterdam). Formatting uses Dutch locale.
 */

const LOCALE = "nl-NL";
const TZ = "Europe/Amsterdam";

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

/** The site-timezone wall clock at an instant; `month` is 1-based. */
export interface SiteParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  ms: number;
}

export function siteParts(d: Date): SiteParts {
  const p = Object.fromEntries(
    partsFmt.formatToParts(d).map((x) => [x.type, Number(x.value)]),
  );
  const ms = ((d.getTime() % 1000) + 1000) % 1000;
  return {
    year: p.year,
    month: p.month,
    day: p.day,
    hour: p.hour,
    minute: p.minute,
    second: p.second,
    ms,
  };
}

/** How far the site timezone is ahead of UTC at `instant`, in milliseconds. */
function siteOffsetMs(instant: number): number {
  const p = siteParts(new Date(instant));
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(instant / 1000) * 1000;
}

/**
 * The instant at which the site timezone's clock reads the given wall time.
 *
 * Production runs in UTC, so `new Date(y, m, d, h, min)` — which uses the
 * *server's* timezone — put every entered time one or two hours early on the
 * site: 19:30 was stored as 19:30 UTC and shown as 21:30. This never depends on
 * the server's timezone.
 */
export function siteWallTime(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  // The offset depends on the instant being solved for, so correct once: this
  // lands on the right side of a DST change.
  const first = asUtc - siteOffsetMs(asUtc);
  return new Date(asUtc - siteOffsetMs(first));
}

/** Offset-less "YYYY-MM-DDTHH:mm[:ss]", as `datetime-local` inputs submit it. */
const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function wallParts(value: string): number[] | null {
  const m = WALL_TIME.exec(value);
  return m ? m.slice(1).map((n) => Number(n ?? 0)) : null;
}

/**
 * Read a stored event datetime.
 *
 * An offset-less value (`'2026-08-22T17:30'`) is read as **UTC**. That is not
 * what an editor meant when typing it, but it is what these values mostly are:
 * the edit form used to prefill an imported `…Z` time by cutting it to its first
 * 16 characters, so saving an imported event stored its UTC clock time without
 * the `Z`. Production ran in UTC and read them back correctly, and reading them
 * as Amsterdam time shifted every such event two hours early. Forms now save
 * with an explicit `Z` (`siteInputToIso`), so no new offset-less values appear.
 *
 * Values with an offset or `Z`, and Dates YAML already parsed, are taken as they
 * are. The result never depends on the server's timezone.
 */
export function parseStoredDateTime(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const p = wallParts(value);
  if (!p) return new Date(value);
  const [y, mo, d, h, mi, s] = p;
  return new Date(Date.UTC(y, mo - 1, d, h, mi, s));
}

/**
 * A `datetime-local` value typed in a form — Amsterdam wall time — as an
 * unambiguous UTC ISO string for storage. Anything that is not such a value is
 * returned unchanged, for validation to deal with.
 */
export function siteInputToIso(value: string | undefined): string | undefined {
  const p = value ? wallParts(value) : null;
  if (!p) return value;
  const [y, mo, d, h, mi, s] = p;
  return siteWallTime(y, mo, d, h, mi, s).toISOString();
}

/**
 * A stored event datetime as the Amsterdam wall time a `datetime-local` input
 * shows, so what an editor sees is what the site shows — and saving unchanged
 * keeps the same instant.
 */
export function toSiteInputValue(value: unknown): string {
  const d = parseStoredDateTime(value);
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const p = siteParts(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Midnight today in the site timezone — the lower bound for "upcoming" listings.
 * `setHours(0)` used the server's midnight, 02:00 in Amsterdam on a UTC server.
 */
export function startOfToday(now: Date = new Date()): Date {
  const p = siteParts(now);
  return siteWallTime(p.year, p.month, p.day);
}

/**
 * `d` moved by `n` calendar days, keeping its wall-clock time in the site
 * timezone across a DST change. `setDate` kept the *server's* wall time, so on a
 * UTC server a weekly 19:30 event read 18:30 after the clocks went back.
 */
export function addDays(d: Date, n: number): Date {
  const p = siteParts(d);
  return siteWallTime(p.year, p.month, p.day + n, p.hour, p.minute, p.second, p.ms);
}

/**
 * `d` moved by `n` calendar months in the site timezone, keeping its wall-clock
 * time. A day past the end of the target month overflows into the next, as
 * `setMonth` does.
 */
export function addMonths(d: Date, n: number): Date {
  const p = siteParts(d);
  return siteWallTime(p.year, p.month + n, p.day, p.hour, p.minute, p.second, p.ms);
}

const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TZ,
});

const dateLongFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const timeFmt = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatDateLong = (d: Date) => dateLongFmt.format(d);
export const formatTime = (d: Date) => timeFmt.format(d);

/** Machine-readable ISO date for <time datetime>. */
export const isoDate = (d: Date) => d.toISOString();

/** "Za 6 jun · 10:00" style label for listings. */
export function formatWhen(start: Date): string {
  return `${formatDate(start)} · ${formatTime(start)}`;
}
