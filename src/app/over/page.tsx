import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Over ons",
  description: "Over de buurtagenda van Goeddoen.",
  path: "/over",
});

export default function OverPage() {
  return (
    <Container className="py-14">
      <article className="prose-warm mx-auto">
        <h1 className="text-4xl sm:text-5xl">Over ons</h1>
        <p>
          Goeddoen is de buurtagenda voor onze wijk. We brengen
          evenementen, locaties en organisatoren op één plek samen, zodat
          iedereen makkelijk kan vinden wat er speelt — en makkelijk kan meedoen.
        </p>
        <p>
          De agenda wordt gevuld door bewoners, vrijwilligers en lokale
          organisaties. Heb je een activiteit die niet mag ontbreken? Dien hem
          in via <a href="/evenement-indienen">Evenement indienen</a>.
        </p>
      </article>
    </Container>
  );
}
