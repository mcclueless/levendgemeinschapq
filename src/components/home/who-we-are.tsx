import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CoverImage } from "@/components/content/cover-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { getOrganisers } from "@/content/repository";
import { routes } from "@/lib/routes";

/**
 * "Wie we zijn" — the collaborating organisations
 * (restyle-homepage-community-pillars, design D6).
 *
 * Reuses the organisatoren content: each organiser is a card that links to its
 * `/organisatoren/<slug>` page. The intent is a cover-image-only card; when an
 * organiser has no cover image yet, the card falls back to its name on a brand
 * panel so the grid is never broken and so the link always carries an accessible
 * label. Renders nothing when there are no organisers.
 */
export async function WhoWeAre() {
  const organisers = await getOrganisers();
  if (organisers.length === 0) return null;

  return (
    <section>
      <SectionHeading
        title="Wie we zijn"
        subtitle="De organisaties die samen Goeddoen vormen."
        moreHref={routes.organisers}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {organisers.map((organiser) => (
          <Card key={organiser.slug} as="article" className="overflow-hidden">
            <Link
              href={organiser.href}
              aria-label={organiser.name}
              className="block transition hover:opacity-90 focus-visible:opacity-90"
            >
              {organiser.featuredImage ? (
                <CoverImage
                  src={organiser.featuredImage}
                  alt={organiser.name}
                  className="h-56"
                />
              ) : (
                <div className="flex h-56 items-center justify-center bg-brand-strong p-6 text-center">
                  <span className="font-display text-xl font-semibold text-white">
                    {organiser.name}
                  </span>
                </div>
              )}
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
