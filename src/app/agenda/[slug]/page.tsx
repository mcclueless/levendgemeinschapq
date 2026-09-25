import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/card";
import { Mdx } from "@/components/mdx/mdx";
import { getEvent } from "@/content/repository";
import { presentOccurrence } from "@/content/event-presentation";
import { DATE_PARAM, occurrenceHref } from "@/content/event-dates";
import { formatDateLong, formatTime, formatWhen, isoDate, startOfToday } from "@/lib/date";
import { pageMetadata } from "@/lib/metadata";
import { shareDescription, shareTitle } from "@/lib/share-preview";
import { recurrenceLabel } from "@/lib/recurrence-label";
import { eventJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { eventCover } from "@/lib/images";
import { SocialLinks } from "@/components/content/social-links";
import { AdminBarMount } from "@/components/admin/admin-bar-mount";
import { adminEditPath } from "@/lib/routes";

/**
 * Rendered per request, not cached (fix-stale-recurring-event-dates D1a/D3).
 *
 * This page shows the next occurrence of a recurring event, computed against
 * `startOfToday()` — a value that is only correct on the day it is produced.
 * Under `generateStaticParams` + `revalidate`, that day was the day of the last
 * build: measurement showed the ISR entry going STALE after its window and never
 * being replaced, because background regeneration does not persist on this
 * deployment. A page built on 31 August still advertised 2 September on
 * 3 September, and only a redeploy corrected it.
 *
 * Lowering `revalidate` would not have helped, since the window is not what
 * fails. Rendering per request is correct by construction and matches the
 * listing routes, which are already `force-dynamic` — and which stayed right
 * throughout, so a visitor could be sent from a correct listing to a stale page.
 *
 * The date must stay server-rendered: preview crawlers run no JavaScript, so
 * computing it in the browser would fix the page and leave every share card
 * wrong (D2).
 *
 * `?datum=YYYY-MM-DD` presents one date of the event (event-multiple-dates D5).
 * The canonical URL stays the bare path, so dated links do not compete with it
 * in search results.
 */
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};
  // The same occurrence the page body renders, so a shared card never
  // advertises a date that differs from the page it opens (D3).
  const { start: when } = presentOccurrence(
    event,
    startOfToday(),
    (await searchParams)[DATE_PARAM],
  );
  return pageMetadata({
    title: event.title,
    description: event.excerpt,
    path: event.href,
    type: "article",
    images: event.featuredImage ? [event.featuredImage] : undefined,
    shareTitle: shareTitle(event.title, event.venue?.name),
    shareDescription: shareDescription({
      when,
      recurrence: event.recurrence,
      excerpt: event.excerpt,
    }),
  });
}

export default async function EventPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const shown = presentOccurrence(
    event,
    startOfToday(),
    (await searchParams)[DATE_PARAM],
  );
  const when = shown.start;

  return (
    <>
      <AdminBarMount
        type="event"
        slug={event.slug}
        title={event.title}
        editHref={adminEditPath("event", event.slug)}
      />
      <Container className="py-14">
        <JsonLd data={eventJsonLd(event, shown)} />

        <div className="max-w-3xl">
          {/* Cover image — uploaded featured image, or the branded default. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={eventCover(event.featuredImage)}
            alt={event.title}
            className="mb-8 aspect-[2/1] w-full rounded-xl object-cover"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              <time dateTime={isoDate(when)}>
                {formatDateLong(when)} · {formatTime(when)}
              </time>
            </Badge>
            {/* Marked only where there is a choice of dates, so a single-date
                event renders exactly as before (event-multiple-dates). */}
            {shown.past && (shown.others.length > 0 || shown.requested) ? (
              <Badge tone="neutral">Geweest</Badge>
            ) : null}
            {event.recurrence ? (
              <Badge tone="success">
                {recurrenceLabel(event.recurrence)}
              </Badge>
            ) : null}
          </div>

          {shown.others.length > 0 ? (
            <div className="mt-4">
              <h2 id="other-dates" className="text-sm font-medium text-muted">
                Ook op
              </h2>
              <ul aria-labelledby="other-dates" className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {shown.others.map((o) => (
                  <li key={o.start.getTime()}>
                    <Link
                      href={occurrenceHref(event.href, o.start)}
                      className={
                        o.past
                          ? "text-muted hover:underline"
                          : "font-medium text-brand-strong hover:underline"
                      }
                    >
                      <time dateTime={isoDate(o.start)}>{formatWhen(o.start)}</time>
                    </Link>
                    {o.past ? <span className="ml-1 text-xs text-muted">(geweest)</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <h1 className="mt-4 text-4xl sm:text-5xl">{event.title}</h1>

          <p className="mt-4 text-muted">
            {event.venue ? (
              <>
                📍{" "}
                <Link
                  href={event.venue.href}
                  className="font-medium text-brand-strong hover:underline"
                >
                  {event.venue.name}
                </Link>
              </>
            ) : null}
            {event.organiser ? (
              <>
                {"  ·  "}georganiseerd door{" "}
                <Link
                  href={event.organiser.href}
                  className="font-medium text-brand-strong hover:underline"
                >
                  {event.organiser.name}
                </Link>
              </>
            ) : null}
          </p>

          <SocialLinks socials={event.socials} className="mt-4" />

          <div className="mt-8">
            <Mdx source={event.body} />
          </div>
        </div>
      </Container>
    </>
  );
}
