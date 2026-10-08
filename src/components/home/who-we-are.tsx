import Link from "next/link";
import { Card } from "@/components/ui/card";
import { OrganiserCardImage } from "@/components/content/organiser-card-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { getOrganisers } from "@/content/repository";
import { routes } from "@/lib/routes";

/**
 * "Wie we zijn" — the collaborating organisations
 * (restyle-homepage-community-pillars, design D6).
 *
 * Reuses the organisatoren content: each organiser is a card that links to its
 * `/organisatoren/<slug>` page, showing its logo, else its cover, else its name
 * on a brand panel — the same rule as the organisers overview
 * (organiser-card-logo). The link always carries an accessible label. Renders
 * nothing when there are no organisers.
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
              <OrganiserCardImage organiser={organiser} />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
