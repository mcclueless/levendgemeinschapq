/**
 * Date helpers. The site operates in a fixed timezone for event logic
 * (design risk note: Europe/Amsterdam). Formatting uses Dutch locale.
 */

const LOCALE = "nl-NL";
const TZ = "Europe/Amsterdam";

/** Midnight today — the lower bound for "upcoming" listings. */
export function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
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
