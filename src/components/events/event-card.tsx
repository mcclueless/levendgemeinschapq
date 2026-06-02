import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";
import { formatWhen, isoDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { EventOccurrence } from "@/content/types";

/** Warm gradient fallback when an event has no featured image. */
function fallbackGradient(slug: string): string {
  const pairs = [
    ["#e7c98f", "#d99224"],
    ["#d98c6a", "#b8502e"],
    ["#8fae90", "#436145"],
    ["#e0b9a3", "#a8553a"],
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  const [a, b] = pairs[Math.abs(hash) % pairs.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function Thumb({ src, alt, slug }: { src?: string; alt: string; slug: string }) {
  if (src) {
    return (
      // Optimization via next/image is wired in Group 10 once the media CDN exists.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-44 w-full object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="h-44 w-full"
      style={{ background: fallbackGradient(slug) }}
    />
  );
}

/** Card variant — used in image listings. */
export function EventCard({ occurrence }: { occurrence: EventOccurrence }) {
  const { event, start } = occurrence;
  return (
    <Card as="article" className="group overflow-hidden">
      <Link href={event.href} className="block">
        <Thumb src={event.featuredImage} alt={event.title} slug={event.slug} />
        <div className="p-5">
          <Badge tone="saffron">
            <time dateTime={isoDate(start)}>{formatWhen(start)}</time>
          </Badge>
          <h3 className="mt-3 text-xl group-hover:text-terracotta-strong">
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
        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3.5 transition-colors hover:text-terracotta-strong"
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
