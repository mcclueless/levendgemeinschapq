import { Container } from "@/components/ui/container";
import { CookiePreferences } from "@/components/consent/cookie-preferences";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Cookiebeleid",
  description: "Welke cookies we gebruiken en hoe je je voorkeuren beheert.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <Container className="py-14">
      <article className="prose-warm mx-auto">
        <h1 className="text-4xl sm:text-5xl">Cookiebeleid</h1>
        <p>
          We willen je zo min mogelijk lastigvallen met cookies. Daarom plaatsen
          we standaard alleen wat strikt noodzakelijk is.
        </p>

        <h2>Noodzakelijke cookies</h2>
        <p>
          Deze zijn nodig om de site te laten werken en om je cookievoorkeur te
          onthouden. Ze vereisen geen toestemming.
        </p>

        <h2>Niet-essentiële cookies</h2>
        <p>
          Voor onderdelen van derden, zoals de kaart van Google Maps op
          locatiepagina’s, plaatsen we pas cookies nadat je daar toestemming voor
          geeft. Geef je geen toestemming, dan tonen we in plaats daarvan een
          knop om het onderdeel handmatig te laden.
        </p>

        <h2>Je voorkeuren</h2>
        <p>Hier kun je je keuze op elk moment aanpassen:</p>
        <CookiePreferences />
      </article>
    </Container>
  );
}
