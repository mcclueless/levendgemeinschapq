import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/card";
import { Field, Input, Select, SubmitButton, Textarea } from "@/components/admin/form";
import { pageMetadata } from "@/lib/metadata";
import { getOrganisers, getVenues } from "@/content/repository";
import { submitEvent } from "./actions";

export const metadata = pageMetadata({
  title: "Evenement indienen",
  description: "Dien een evenement in voor de buurtagenda.",
  path: "/evenement-indienen",
});
export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ ingediend?: string; error?: string }>;
}) {
  const [params, venues, organisers] = await Promise.all([
    searchParams,
    getVenues(),
    getOrganisers(),
  ]);

  if (params.ingediend) {
    return (
      <Container className="py-14">
        <div className="prose-warm mx-auto">
          <Badge tone="success">Ingediend</Badge>
          <h1 className="mt-4 text-4xl sm:text-5xl">Dankjewel!</h1>
          <p>
            Je evenement is ingediend en wacht op goedkeuring door de redactie.
            Zodra het is goedgekeurd, verschijnt het op de agenda.
          </p>
          <p>
            <Link href="/agenda">Terug naar de agenda</Link>
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-2xl">
        <Badge tone="brand">Evenement indienen</Badge>
        <h1 className="mt-4 text-4xl sm:text-5xl">Evenement indienen</h1>
        <p className="mt-3 text-lg text-muted">
          Organiseer je iets in de buurt? Vul het formulier in — na goedkeuring
          door de redactie verschijnt het op de agenda.
        </p>

        {params.error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong"
          >
            Vul alle verplichte velden in.
          </p>
        ) : null}

        <form action={submitEvent} className="mt-8 grid gap-5">
          <Field label="Titel" htmlFor="title" required>
            <Input id="title" name="title" required />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Start" htmlFor="start" required>
              <Input id="start" name="start" type="datetime-local" required />
            </Field>
            <Field label="Einde" htmlFor="end">
              <Input id="end" name="end" type="datetime-local" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Locatie" htmlFor="venue" required>
              <Select id="venue" name="venue" required defaultValue="">
                <option value="" disabled>
                  Kies een locatie…
                </option>
                {venues.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Organisator" htmlFor="organiser" required>
              <Select id="organiser" name="organiser" required defaultValue="">
                <option value="" disabled>
                  Kies een organisator…
                </option>
                {organisers.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Korte omschrijving" htmlFor="excerpt">
            <Input id="excerpt" name="excerpt" />
          </Field>

          <Field label="Toelichting" htmlFor="body">
            <Textarea id="body" name="body" />
          </Field>

          <Field label="Jouw naam of e-mail" htmlFor="submitter" hint="Zodat we contact kunnen opnemen.">
            <Input id="submitter" name="submitter" />
          </Field>

          <div>
            <SubmitButton>Indienen ter goedkeuring</SubmitButton>
          </div>
        </form>
      </div>
    </Container>
  );
}
