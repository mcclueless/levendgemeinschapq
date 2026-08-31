import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Toegankelijkheid",
  description: "Onze inzet voor een toegankelijke website voor iedereen.",
  path: "/toegankelijkheid",
});

export default function ToegankelijkheidPage() {
  return (
    <Container className="py-14">
      <article className="prose-warm mx-auto">
        <h1 className="text-4xl sm:text-5xl">Toegankelijkheid</h1>
        <p>
          We willen dat iedereen de buurtagenda kan gebruiken, ongeacht apparaat
          of beperking. We streven naar het niveau WCAG 2.1 AA.
        </p>

        <h2>Wat we doen</h2>
        <ul>
          <li>Voldoende kleurcontrast en leesbare typografie.</li>
          <li>Volledige bediening met het toetsenbord en zichtbare focus.</li>
          <li>Betekenisvolle afbeeldingen voorzien van een tekstalternatief.</li>
          <li>Een responsive ontwerp voor telefoon, tablet en computer.</li>
          <li>Respect voor de voorkeur “verminderde beweging”.</li>
        </ul>

        <h2>Iets niet toegankelijk?</h2>
        <p>
          Kom je toch een drempel tegen? Laat het ons weten via{" "}
          <a href="mailto:info@goeddoen.net">
            info@goeddoen.net
          </a>{" "}
          — dan lossen we het op.
        </p>
      </article>
    </Container>
  );
}
