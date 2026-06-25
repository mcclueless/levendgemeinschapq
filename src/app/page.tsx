import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { UpcomingEvents } from "@/components/events/upcoming-events";
import { JsonLd } from "@/components/seo/json-ld";
import { siteJsonLd } from "@/lib/structured-data";

// Rendered per request (dynamic-content-listings): the upcoming-events preview
// reads S3 live so a publish/edit/hide/delete shows on the next request, with
// no CDN-cache lag — matching the listing pages.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <JsonLd data={siteJsonLd()} />
      {/* Hero ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 15% 10%, rgba(217,146,36,0.18), transparent 60%), radial-gradient(55% 55% at 90% 20%, rgba(184,80,46,0.14), transparent 55%)",
          }}
        />
        <Container className="py-20 sm:py-28">
          <Badge tone="terracotta">De buurtagenda</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl sm:text-6xl">
            Ontdek wat er speelt in de{" "}
            <span className="text-terracotta-strong">Levende Gemeenschap</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Eén overzichtelijke plek voor alle evenementen, organisatoren en
            locaties in de buurt. Vandaag, deze week en alles wat eraan komt.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/agenda" size="lg">
              Bekijk de agenda
            </ButtonLink>
            <ButtonLink href="/evenement-indienen" size="lg" variant="secondary">
              Evenement indienen
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Upcoming events — reusable, self-resolving listing --------------- */}
      <Container className="py-8">
        <UpcomingEvents
          title="Binnenkort in de buurt"
          subtitle="Vandaag en in de komende weken."
          limit={6}
          variant="image"
        />
      </Container>
    </>
  );
}
