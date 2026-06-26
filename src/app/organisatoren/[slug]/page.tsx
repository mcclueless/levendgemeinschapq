import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/card";
import { Mdx } from "@/components/mdx/mdx";
import { ContactInfo } from "@/components/content/contact-info";
import { CoverImage } from "@/components/content/cover-image";
import { SocialLinks } from "@/components/content/social-links";
import { UpcomingEvents } from "@/components/events/upcoming-events";
import { JsonLd } from "@/components/seo/json-ld";
import { getOrganiser, getOrganisers, getVenue } from "@/content/repository";
import { pageMetadata } from "@/lib/metadata";
import { organiserJsonLd } from "@/lib/structured-data";
import { AdminBarMount } from "@/components/admin/admin-bar-mount";
import { adminEditPath } from "@/lib/routes";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getOrganisers()).map((o) => ({ slug: o.slug }));
}

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
        <Badge tone="brand">Organisator</Badge>
        <h1 className="mt-4 text-4xl sm:text-5xl">{organiser.name}</h1>

        <CoverImage
          src={organiser.featuredImage}
          alt={organiser.name}
          className="mt-8 aspect-[2/1] rounded-xl"
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div>
            <Mdx source={organiser.body} />
          </div>
          <aside>
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
