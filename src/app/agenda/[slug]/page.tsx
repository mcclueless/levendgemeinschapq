import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/card";
import { Mdx } from "@/components/mdx/mdx";
import { getAllEvents, getEvent } from "@/content/repository";
import { nextOccurrence } from "@/content/recurrence";
import { formatDateLong, formatTime, isoDate, startOfToday } from "@/lib/date";
import { pageMetadata } from "@/lib/metadata";
import { shareDescription, shareTitle } from "@/lib/share-preview";
import { recurrenceLabel } from "@/lib/recurrence-label";
import { eventJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { eventCover } from "@/lib/images";
import { SocialLinks } from "@/components/content/social-links";
import { AdminBarMount } from "@/components/admin/admin-bar-mount";
import { adminEditPath } from "@/lib/routes";

export const revalidate = 600;

export async function generateStaticParams() {
  const events = await getAllEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};
  // The same occurrence the page body renders, so a shared card never
  // advertises a date that differs from the page it opens (D3).
  const when =
    nextOccurrence(event.start, event.recurrence, startOfToday()) ?? event.start;
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

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const when = nextOccurrence(event.start, event.recurrence, startOfToday()) ?? event.start;

  return (
    <>
      <AdminBarMount
        type="event"
        slug={event.slug}
        title={event.title}
        editHref={adminEditPath("event", event.slug)}
      />
      <Container className="py-14">
        <JsonLd data={eventJsonLd(event, when)} />

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
            {event.recurrence ? (
              <Badge tone="success">
                {recurrenceLabel(event.recurrence)}
              </Badge>
            ) : null}
          </div>

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
