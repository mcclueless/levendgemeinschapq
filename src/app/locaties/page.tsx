import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, Badge } from "@/components/ui/card";
import { CoverImage } from "@/components/content/cover-image";
import { getVenues } from "@/content/repository";
import { AdminListingNotice } from "@/components/admin/admin-listing-notice";

// Rendered per request (dynamic-content-listings): reads S3 live so a
// publish/edit/hide/delete shows on the next request, with no CDN-cache lag.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Locaties",
  description: "De plekken in de buurt waar evenementen plaatsvinden.",
};

export default async function VenuesPage() {
  const venues = await getVenues();

  return (
    <Container className="py-14">
      <AdminListingNotice />
      <Badge tone="terracotta">Locaties</Badge>
      <h1 className="mt-4 text-4xl sm:text-5xl">Locaties in de buurt</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        De plekken waar de buurt samenkomt.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <Card key={venue.slug} as="article" className="overflow-hidden">
            <CoverImage src={venue.featuredImage} alt={venue.name} className="h-44" />
            <div className="p-6">
              <h2 className="text-xl">
                <Link
                  href={venue.href}
                  className="hover:text-terracotta-strong"
                >
                  {venue.name}
                </Link>
              </h2>
              {venue.excerpt ? (
                <p className="mt-2 text-sm text-muted">{venue.excerpt}</p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}
