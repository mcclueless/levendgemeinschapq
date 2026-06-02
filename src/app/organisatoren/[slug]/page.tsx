import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/card";
import { Mdx } from "@/components/mdx/mdx";
import { ContactInfo } from "@/components/content/contact-info";
import { Portfolio } from "@/components/content/portfolio";
import { UpcomingEvents } from "@/components/events/upcoming-events";
import { JsonLd } from "@/components/seo/json-ld";
import { getOrganiser, getOrganisers } from "@/content/repository";
import { pageMetadata } from "@/lib/metadata";
import { organiserJsonLd } from "@/lib/structured-data";

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

  return (
    <Container className="py-14">
      <JsonLd data={organiserJsonLd(organiser)} />
      <Badge tone="terracotta">Organisator</Badge>
      <h1 className="mt-4 text-4xl sm:text-5xl">{organiser.name}</h1>

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
              />
            </div>
          </div>
        </aside>
      </div>

      {organiser.portfolio.length > 0 ? (
        <div className="mt-16">
          <h2 className="mb-6 text-2xl sm:text-3xl">Wat wij doen</h2>
          <Portfolio items={organiser.portfolio} />
        </div>
      ) : null}

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
  );
}
