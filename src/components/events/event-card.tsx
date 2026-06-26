import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";
import { formatWhen, isoDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { eventCover } from "@/lib/images";
import type { EventOccurrence } from "@/content/types";

function Thumb({ src, alt }: { src?: string; alt: string }) {
  return (
    // Falls back to the branded default cover when no image was uploaded.
    // Optimization via next/image is wired in Group 10 once the media CDN exists.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={eventCover(src)}
      alt={alt}
      loading="lazy"
      className="h-44 w-full object-cover"
    />
  );
}

/** Card variant — used in image listings. */
export function EventCard({ occurrence }: { occurrence: EventOccurrence }) {
  const { event, start } = occurrence;
  return (
    <Card as="article" className="group overflow-hidden">
      <Link href={event.href} className="block">
        <Thumb src={event.featuredImage} alt={event.title} />
        <div className="p-5">
          <Badge tone="accent">
            <time dateTime={isoDate(start)}>{formatWhen(start)}</time>
          </Badge>
          <h3 className="mt-3 text-xl group-hover:text-brand-strong">
            {event.title}
          </h3>
          {event.venue ? (
            <p className="mt-1 text-sm text-muted">{event.venue.name}</p>
          ) : null}
        </div>
      </Link>
    </Card>
  );
}

/** Compact row variant — used in text-only listings (no featured image). */
export function EventRow({
  occurrence,
  className,
}: {
  occurrence: EventOccurrence;
  className?: string;
}) {
  const { event, start } = occurrence;
  return (
    <li className={cn("border-b border-border last:border-0", className)}>
      <Link
        href={event.href}
        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3.5 transition-colors hover:text-brand-strong"
      >
        <time
          dateTime={isoDate(start)}
          className="w-40 shrink-0 font-medium text-muted"
        >
          {formatWhen(start)}
        </time>
        <span className="text-lg font-medium">{event.title}</span>
        {event.venue ? (
          <span className="text-sm text-muted">· {event.venue.name}</span>
        ) : null}
      </Link>
    </li>
  );
}
