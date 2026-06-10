import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/card";
import { Mdx } from "@/components/mdx/mdx";
import { ContactInfo } from "@/components/content/contact-info";
import { CoverImage } from "@/components/content/cover-image";
import { Gallery } from "@/components/content/gallery";
import { MapEmbed } from "@/components/content/map-embed";
import { UpcomingEvents } from "@/components/events/upcoming-events";
import { JsonLd } from "@/components/seo/json-ld";
import { getVenue, getVenues } from "@/content/repository";
import { pageMetadata } from "@/lib/metadata";
import { venueJsonLd } from "@/lib/structured-data";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getVenues()).map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) return {};
  return pageMetadata({
    title: venue.name,
    description: venue.excerpt,
    path: venue.href,
    images: venue.featuredImage ? [venue.featuredImage] : undefined,
  });
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) notFound();

  const mapQuery =
    venue.lat != null && venue.lng != null
      ? `${venue.lat},${venue.lng}`
      : venue.address;

  return (
    <Container className="py-14">
      <JsonLd data={venueJsonLd(venue)} />
      <Badge tone="terracotta">Locatie</Badge>
      <h1 className="mt-4 text-4xl sm:text-5xl">{venue.name}</h1>

      <CoverImage
        src={venue.featuredImage}
        alt={venue.name}
        className="mt-8 aspect-[2/1] rounded-xl"
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <Mdx source={venue.body} />
          <div className="mt-8">
            <Gallery images={venue.images} alt={venue.name} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg">Contact</h2>
            <div className="mt-4">
              <ContactInfo
                phone={venue.phone}
                email={venue.email}
                website={venue.website}
                address={venue.address}
              />
            </div>
          </div>
          {mapQuery ? <MapEmbed query={mapQuery} label={venue.name} /> : null}
        </aside>
      </div>

      <div className="mt-16">
        <UpcomingEvents
          title={`Binnenkort bij ${venue.name}`}
          venueSlug={venue.slug}
          variant="image"
          limit={6}
          emptyLabel="Nog geen geplande evenementen op deze locatie."
        />
      </div>
    </Container>
  );
}
