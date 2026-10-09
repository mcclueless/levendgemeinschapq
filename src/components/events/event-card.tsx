import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";
import { formatDate, formatWhen, isoDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { eventCover } from "@/lib/images";
import type { EventOccurrence } from "@/content/types";
import { occurrenceLink } from "@/content/event-dates";
import { DescribedImage } from "@/components/content/described-image";

function Thumb({ src, alt }: { src?: string; alt: string }) {
  return (
    // Falls back to the branded default cover when no image was uploaded.
    // Optimization via next/image is wired in Group 10 once the media CDN exists.
    <DescribedImage
      src={eventCover(src)}
      detailsOf={src}
      alt={alt}
      loading="lazy"
      className="h-44 w-full object-cover"
    />
  );
}

/**
 * An agenda marker's card (event-no-page D3): the whole image, uncropped, then
 * the date without a time and the title. Not a link — a marker has no page.
 *
 * The image is fitted inside the same height as an ordinary card's image, so a
 * tall picture never stretches the grid row and the events beside it. The
 * background is the card's own white, not a grey panel: a 16:9 image with its
 * own white background then blends in instead of showing as a white box
 * (tester report, 8 October 2026, the same issue as organiser logos).
 */
function MarkerCard({ occurrence }: { occurrence: EventOccurrence }) {
  const { event, start } = occurrence;
  return (
    <Card as="article" className="overflow-hidden">
      <DescribedImage src={eventCover(event.featuredImage)} detailsOf={event.featuredImage} alt={event.title} loading="lazy" className="h-44 w-full bg-surface object-contain" />
      <div className="p-5">
        <Badge tone="accent">
          <time dateTime={isoDate(start)}>{formatDate(start)}</time>
        </Badge>
        <h3 className="mt-3 text-xl">{event.title}</h3>
      </div>
    </Card>
  );
}

/** Card variant — used in image listings. */
export function EventCard({ occurrence }: { occurrence: EventOccurrence }) {
  const { event, start } = occurrence;
  if (event.noPage) return <MarkerCard occurrence={occurrence} />;
  return (
    <Card as="article" className="group overflow-hidden">
      <Link href={occurrenceLink(event, start)} className="block">
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
  if (event.noPage) {
    // A marker: its day and title, no time and no link (event-no-page D3).
    return (
      <li className={cn("border-b border-border last:border-0", className)}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3.5">
          <time dateTime={isoDate(start)} className="w-40 shrink-0 font-medium text-muted">
            {formatDate(start)}
          </time>
          <span className="text-lg font-medium">{event.title}</span>
        </div>
      </li>
    );
  }
  return (
    <li className={cn("border-b border-border last:border-0", className)}>
      <Link
        href={occurrenceLink(event, start)}
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
