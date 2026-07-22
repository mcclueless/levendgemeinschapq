import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { PhotoBand, PhotoPanel } from "@/components/home/photo-panel";
import { UpcomingEvents } from "@/components/events/upcoming-events";
import { FeaturedProjects } from "@/components/projects/featured-projects";
import { JsonLd } from "@/components/seo/json-ld";
import { siteJsonLd } from "@/lib/structured-data";
import church from "../../public/home/sint-theresiakerk.webp";
import projecten from "../../public/home/projecten.webp";

// Rendered per request (dynamic-content-listings): the upcoming-events preview
// reads S3 live so a publish/edit/hide/delete shows on the next request, with
// no CDN-cache lag — matching the listing pages.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <JsonLd data={siteJsonLd()} />

      {/* Hero — split photo/colour panel (restyle-homepage-photo-panels).
          Every string below is unchanged from the pre-restyle homepage; only
          the frame around them is new. Badge and buttons carry homepage-local
          className overrides because their default tones are built for a light
          canvas and would be dark-on-dark here — the shared components
          themselves are untouched. */}
      <PhotoPanel image={church} alt="De Sint-Theresiakerk in de buurt" priority>
        <Badge tone="brand" className="bg-white/15 text-white">
          De buurtagenda
        </Badge>
        {/* text-white is explicit: globals.css sets `h1..h4 { color: ink }`
            in the base layer, which beats an inherited colour. */}
        <h1 className="mt-5 text-4xl text-white sm:text-5xl lg:text-6xl">
          Ontdek wat er speelt in de{" "}
          <span className="text-accent">Levende Gemeenschap</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/85">
          Eén overzichtelijke plek voor alle evenementen, organisatoren en
          locaties in de buurt. Vandaag, deze week en alles wat eraan komt.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/agenda" size="lg" variant="secondary">
            Bekijk de agenda
          </ButtonLink>
          <ButtonLink
            href="/evenement-indienen"
            size="lg"
            variant="secondary"
            className="border-white/60 bg-transparent text-white hover:bg-white/10"
          >
            Evenement indienen
          </ButtonLink>
        </div>
      </PhotoPanel>

      {/* Upcoming events — reusable, self-resolving listing --------------- */}
      <div className="bg-canvas">
        <Container className="py-14 sm:py-20">
          <UpcomingEvents
            title="Binnenkort in de buurt"
            subtitle="Vandaag en in de komende weken."
            limit={6}
            variant="image"
          />
        </Container>
      </div>

      {/* Textless photographic band separating the two listings. Left-anchored
          crop: this photograph is near-square with its subject off-centre, so a
          centre crop would cut it (design D6). */}
      <PhotoBand
        image={projecten}
        alt="Illustratie van een plattegrond van de buurttuin, met genummerde perken rond een fontein"
        objectPosition="0% 50%"
      />

      {/* Projects — newest initiatives, self-resolving listing ------------ */}
      <div className="bg-surface-2">
        <Container className="py-14 sm:py-20">
          <FeaturedProjects
            title="Projecten in de buurt"
            subtitle="Lopende en afgeronde buurtinitiatieven."
            limit={6}
            emptyLabel="Er zijn nog geen projecten."
          />
        </Container>
      </div>
    </>
  );
}
