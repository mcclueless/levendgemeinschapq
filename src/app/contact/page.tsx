import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Neem contact op met de redactie van de buurtagenda.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Container className="py-14">
      <article className="prose-warm mx-auto">
        <h1 className="text-4xl sm:text-5xl">Contact</h1>
        <p>
          Vragen, ideeën of iets te melden? We horen graag van je. Mail ons op{" "}
          <a href="mailto:info@goeddoen.net">
            info@goeddoen.net
          </a>
          .
        </p>
        <p>
          Wil je een evenement op de agenda? Gebruik dan{" "}
          <a href="/evenement-indienen">Evenement indienen</a> — dan komt het
          netjes in de wachtrij voor publicatie.
        </p>
      </article>
    </Container>
  );
}
