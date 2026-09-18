import { EventCard, EventRow } from "./event-card";
import { EventTable } from "./event-table";
import type { EventOccurrence } from "@/content/types";

export type EventListVariant = "image" | "text" | "table";

/**
 * Presentational event listing (events spec). Three variants:
 *  - "image" — responsive card grid with featured images
 *  - "text"  — compact, image-free rows
 *  - "table" — scannable columns, stacked on phones (event-list-table-view)
 */
export function EventList({
  occurrences,
  variant = "image",
  emptyLabel = "Geen aankomende evenementen.",
}: {
  occurrences: EventOccurrence[];
  variant?: EventListVariant;
  emptyLabel?: string;
}) {
  if (occurrences.length === 0) {
    return <p className="text-muted">{emptyLabel}</p>;
  }

  const key = (o: EventOccurrence) => `${o.event.slug}-${o.start.getTime()}`;

  if (variant === "table") {
    return <EventTable occurrences={occurrences} />;
  }

  if (variant === "text") {
    return (
      <ul className="rounded-lg border border-border bg-surface px-5">
        {occurrences.map((o) => (
          <EventRow key={key(o)} occurrence={o} />
        ))}
      </ul>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {occurrences.map((o) => (
        <EventCard key={key(o)} occurrence={o} />
      ))}
    </div>
  );
}
