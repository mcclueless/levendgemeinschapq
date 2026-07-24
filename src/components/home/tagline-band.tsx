import { Container } from "@/components/ui/container";

/**
 * Full-width tagline separator (restyle-homepage-community-pillars, design D5).
 *
 * A flat brand-strong band carrying the organisation's tagline, placed between
 * the pillars and the projects section — the position it held on the predecessor
 * site. Existing tokens only; no new palette colour. Rendered as a paragraph,
 * not a heading, because it is a decorative refrain rather than a section title.
 */
export function TaglineBand() {
  return (
    <section className="bg-brand-strong">
      <Container className="py-12 sm:py-16">
        <p className="text-center font-display text-2xl font-semibold text-balance text-white sm:text-3xl lg:text-4xl">
          Het levde is een feestje, maar je moet de slingers zelf ophangen
        </p>
      </Container>
    </section>
  );
}
