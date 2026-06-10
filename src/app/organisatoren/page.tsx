import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, Badge } from "@/components/ui/card";
import { CoverImage } from "@/components/content/cover-image";
import { getOrganisers } from "@/content/repository";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Organisatoren",
  description: "De mensen en organisaties die de buurt levendig houden.",
};

export default async function OrganisersPage() {
  const organisers = await getOrganisers();

  return (
    <Container className="py-14">
      <Badge tone="terracotta">Organisatoren</Badge>
      <h1 className="mt-4 text-4xl sm:text-5xl">Organisatoren</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        De mensen en organisaties die activiteiten in de buurt mogelijk maken.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {organisers.map((organiser) => (
          <Card key={organiser.slug} as="article" className="overflow-hidden">
            <CoverImage
              src={organiser.featuredImage}
              alt={organiser.name}
              className="h-44"
            />
            <div className="p-6">
              <h2 className="text-xl">
                <Link
                  href={organiser.href}
                  className="hover:text-terracotta-strong"
                >
                  {organiser.name}
                </Link>
              </h2>
              {organiser.excerpt ? (
                <p className="mt-2 text-sm text-muted">{organiser.excerpt}</p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}
