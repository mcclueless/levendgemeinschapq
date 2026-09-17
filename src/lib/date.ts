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

/**
 * Read a stored event datetime. The event forms store the wall time the editor
 * typed, with no offset (`'2026-09-25T19:30'`); that means site time, whatever
 * the server's timezone. Anything carrying its own offset or `Z`, and Dates
 * YAML already parsed, are taken as they are.
 */
export function parseSiteDateTime(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const m = WALL_TIME.exec(value);
  if (!m) return new Date(value);
  const [y, mo, d, h, mi, s] = m.slice(1).map((n) => Number(n ?? 0));
  return siteWallTime(y, mo, d, h, mi, s);
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
