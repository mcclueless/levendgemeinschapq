import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Mdx } from "@/components/mdx/mdx";
import { ContactInfo } from "@/components/content/contact-info";
import { Slideshow } from "@/components/content/slideshow";
import { cn } from "@/lib/cn";
import { SocialLinks } from "@/components/content/social-links";
import { UpcomingEvents } from "@/components/events/upcoming-events";
import { JsonLd } from "@/components/seo/json-ld";
import { getOrganiser, getVenue } from "@/content/repository";
import { pageMetadata } from "@/lib/metadata";
import { organiserJsonLd } from "@/lib/structured-data";
import { AdminBarMount } from "@/components/admin/admin-bar-mount";
import { adminEditPath } from "@/lib/routes";

/**
 * Rendered per request (fix-stale-recurring-event-dates D5). Anything prerendered
 * at build time describes the committed `content/` seed, not production: the
 * store reads the seed during `next build` and S3 at runtime, and the
 * regeneration that was supposed to reconcile the two never persists on this
 * deployment. Prerendering therefore froze seed data permanently.
 */
export const dynamic = "force-dynamic";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const organiser = await getOrganiser(slug);
  if (!organiser) return {};
  return pageMetadata({
    title: organiser.name,
    description: organiser.excerpt,
    path: organiser.href,
    images: organiser.featuredImage ? [organiser.featuredImage] : undefined,
  });
}

export default async function OrganiserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const organiser = await getOrganiser(slug);
  if (!organiser) notFound();

  // Resolve the optional linked location; omit gracefully if it no longer
  // resolves (e.g. the venue was hidden — link-only, no hide guard).
  const location = organiser.location
    ? await getVenue(organiser.location)
    : null;

  return (
    <>
      <AdminBarMount
        type="organiser"
        slug={organiser.slug}
        title={organiser.name}
        editHref={adminEditPath("organiser", organiser.slug)}
      />
      <Container className="py-14">
        <JsonLd data={organiserJsonLd(organiser)} />
        {/*
          One grid in phone reading order — name, logo, images, text, contact —
          placed into two columns on wide screens (organiser-page-layout D5), so
          reading and tab order are the same at every width.
        */}
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-x-10">
          <h1 className="text-4xl sm:text-5xl lg:col-start-1 lg:row-start-1 lg:self-center">
            {organiser.name}
          </h1>

          {organiser.logo ? (
            <div className="lg:col-start-2 lg:row-start-1 lg:flex lg:items-center lg:justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={organiser.logo}
                alt={organiser.name}
                className="max-h-20 w-auto max-w-[12rem] object-contain lg:max-h-28 lg:max-w-full"
              />
            </div>
          ) : null}

          {organiser.images.length > 0 ? (
            <Slideshow
              images={organiser.images}
              alt={organiser.name}
              className="lg:col-start-1 lg:row-start-2"
            />
          ) : null}

          <div
            className={
              organiser.images.length > 0
                ? "lg:col-start-1 lg:row-start-3"
                : "lg:col-start-1 lg:row-start-2"
            }
          >
            <Mdx source={organiser.body} />
          </div>

          <aside
            className={cn(
              "lg:col-start-2 lg:self-start",
              organiser.logo ? "lg:row-start-2 lg:row-span-2" : "lg:row-start-1 lg:row-span-3",
            )}
          >
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="text-lg">Contact</h2>
              <div className="mt-4">
                <ContactInfo
                  phone={organiser.phone}
                  email={organiser.email}
                  website={organiser.website}
                  location={
                    location
                      ? { name: location.name, href: location.href }
                      : undefined
                  }
                />
                <SocialLinks socials={organiser.socials} className="mt-5" />
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-16">
          <UpcomingEvents
            title={`Binnenkort van ${organiser.name}`}
            organiserSlug={organiser.slug}
            variant="image"
            limit={6}
            emptyLabel="Nog geen geplande evenementen van deze organisator."
          />
        </div>
      </Container>
    </>
  );
}
