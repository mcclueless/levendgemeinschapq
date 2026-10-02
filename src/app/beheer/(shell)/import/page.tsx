import type { Metadata } from "next";
import Link from "next/link";
import {
  Field,
  FormError,
  Input,
  Select,
  SubmitButton,
} from "@/components/admin/form";
import { requireAdmin } from "@/lib/auth-server";
import { getOrganisers, getVenues } from "@/content/repository";
import { createFeedAction } from "@/app/beheer/actions";

export const metadata: Metadata = {
  title: "Feed toevoegen",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const [params, venues, organisers] = await Promise.all([
    searchParams,
    getVenues(),
    getOrganisers(),
  ]);

  return (
    <>
      <h1 className="text-3xl">Feed toevoegen</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Sla een Google Calendar- of iCal-link (.ics) op. De link blijft bewaard,
        zodat je hem later met één klik opnieuw kunt synchroniseren — zie{" "}
        <Link href="/beheer/feeds" className="underline underline-offset-2">
          Agenda-feeds
        </Link>
        . Geïmporteerde evenementen komen als concept in de wachtrij.
      </p>

      <FormError code={params.error} />

      <form action={createFeedAction} className="mt-8 grid max-w-2xl gap-5">
        <Field label="Naam" htmlFor="label" required hint="Alleen voor jezelf, in het overzicht.">
          <Input id="label" name="label" required placeholder="Buurtagenda Noord" />
        </Field>

        <Field
          label="Agenda-URL"
          htmlFor="url"
          required
          hint="Een openbare Google Calendar- of iCal-link (.ics)."
        >
          <Input id="url" name="url" type="url" placeholder="https://…/basic.ics" required />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Standaard locatie" htmlFor="defaultVenue" required>
            <Select id="defaultVenue" name="defaultVenue" required defaultValue="">
              <option value="" disabled>
                Kies…
              </option>
              {venues.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Standaard organisator" htmlFor="defaultOrganiser" required>
            <Select id="defaultOrganiser" name="defaultOrganiser" required defaultValue="">
              <option value="" disabled>
                Kies…
              </option>
              {organisers.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <SubmitButton>Feed opslaan</SubmitButton>
        </div>
      </form>
    </>
  );
}
