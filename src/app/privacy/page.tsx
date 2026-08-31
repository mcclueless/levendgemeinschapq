import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Privacyverklaring",
  description: "Hoe de Levende Gemeenschap omgaat met je persoonsgegevens.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Container className="py-14">
      <article className="prose-warm mx-auto">
        <h1 className="text-4xl sm:text-5xl">Privacyverklaring</h1>
        <p className="text-sm text-muted">
          Dit is een concepttekst die de organisatie vóór livegang juridisch laat
          controleren.
        </p>

        <h2>Wie zijn wij</h2>
        <p>
          De Levende Gemeenschap (“wij”) beheert deze buurtagenda. Voor vragen
          over privacy kun je mailen naar{" "}
          <a href="mailto:info@goeddoen.net">
            info@goeddoen.net
          </a>
          .
        </p>

        <h2>Welke gegevens we verwerken</h2>
        <ul>
          <li>
            Gegevens die je zelf aanlevert bij het indienen van een evenement of
            blog (zoals naam, e-mailadres en de inhoud van je inzending).
          </li>
          <li>
            Accountgegevens als je als organisator een account hebt (naam,
            e-mailadres).
          </li>
          <li>
            Technische gegevens die noodzakelijk zijn om de site te laten werken.
          </li>
        </ul>

        <h2>Waarvoor we ze gebruiken</h2>
        <p>
          We gebruiken deze gegevens om inzendingen te beoordelen en te
          publiceren, om accounts te beheren en om de site te laten werken. We
          verkopen je gegevens niet.
        </p>

        <h2>Cookies</h2>
        <p>
          We plaatsen standaard alleen noodzakelijke cookies. Niet-essentiële
          cookies (bijvoorbeeld voor kaarten) worden pas geplaatst nadat je
          toestemming hebt gegeven. Zie ons <a href="/cookies">cookiebeleid</a>.
        </p>

        <h2>Bewaartermijn</h2>
        <p>
          We bewaren gegevens niet langer dan nodig is voor de hierboven
          genoemde doelen.
        </p>

        <h2>Je rechten</h2>
        <p>
          Je hebt het recht om je gegevens in te zien, te corrigeren of te laten
          verwijderen. Neem hiervoor contact met ons op via het bovenstaande
          e-mailadres.
        </p>
      </article>
    </Container>
  );
}
