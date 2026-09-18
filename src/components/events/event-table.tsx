import Link from "next/link";
import { formatDate, formatTime, isoDate } from "@/lib/date";
import { recurrenceLabel } from "@/lib/recurrence-label";
import type { EventOccurrence } from "@/content/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "19:30" or "19:30–21:00". The end comes from the event's own duration applied
 * to this occurrence, so a weekly event's later dates get the right end. A
 * duration of a day or more (an all-day or multi-day event) shows the start only;
 * "00:00–00:00" would say nothing.
 */
function timeRange({ event, start }: EventOccurrence): string {
  const duration = event.end ? event.end.getTime() - event.start.getTime() : 0;
  if (duration <= 0 || duration >= DAY_MS) return formatTime(start);
  return `${formatTime(start)}–${formatTime(new Date(start.getTime() + duration))}`;
}

const COLUMNS = ["Datum", "Tijd", "Evenement", "Locatie", "Organisator", "Herhaling"] as const;

const link = "font-medium text-brand-strong underline-offset-4 hover:underline";

/**
 * One cell. On phones rows stack into blocks and each cell shows its column name
 * inline; that label is `aria-hidden` because the (visually hidden) header row
 * already names the column for assistive technology (event-list-table-view D5).
 */
function Cell({
  label,
  children,
  className = "",
}: {
  label: (typeof COLUMNS)[number];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      role="cell"
      className={`flex gap-3 py-0.5 sm:table-cell sm:px-4 sm:py-3 sm:align-top ${className}`}
    >
      <span aria-hidden="true" className="w-24 shrink-0 text-sm text-muted sm:hidden">
        {label}
      </span>
      <span className="min-w-0">{children}</span>
    </td>
  );
}

/**
 * Table variant of the event listing (events spec: Listing display variants).
 *
 * `display` is switched to block below `sm` so rows stack, which strips table
 * semantics in some browsers (notably Safari) — hence the explicit roles.
 */
export function EventTable({ occurrences }: { occurrences: EventOccurrence[] }) {
  return (
    <table role="table" className="block w-full text-left sm:table sm:border-collapse">
      <caption className="sr-only">Aankomende evenementen</caption>
      <thead className="sr-only sm:not-sr-only sm:table-header-group">
        <tr role="row" className="sm:border-b sm:border-border">
          {COLUMNS.map((c) => (
            <th
              key={c}
              role="columnheader"
              scope="col"
              className="text-sm font-medium text-muted sm:px-4 sm:py-2"
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="block rounded-lg border border-border bg-surface px-4 sm:table-row-group sm:px-0">
        {occurrences.map((o) => {
          const { event, start } = o;
          return (
            <tr
              key={`${event.slug}-${start.getTime()}`}
              role="row"
              className="block border-b border-border py-3 last:border-0 sm:table-row sm:py-0"
            >
              <Cell label="Datum" className="whitespace-nowrap">
                <time dateTime={isoDate(start)}>{formatDate(start)}</time>
              </Cell>
              <Cell label="Tijd" className="whitespace-nowrap tabular-nums">
                {timeRange(o)}
              </Cell>
              <Cell label="Evenement">
                <Link href={event.href} className={link}>
                  {event.title}
                </Link>
              </Cell>
              <Cell label="Locatie">
                {event.venue ? (
                  <Link href={event.venue.href} className={link}>
                    {event.venue.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Cell>
              <Cell label="Organisator">
                {event.organiser ? (
                  <Link href={event.organiser.href} className={link}>
                    {event.organiser.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Cell>
              <Cell label="Herhaling" className="whitespace-nowrap text-muted">
                {recurrenceLabel(event.recurrence) ?? "—"}
              </Cell>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
