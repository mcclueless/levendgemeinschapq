import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  CheckboxField,
  Field,
  FormError,
  Input,
  Select,
  SubmitButton,
} from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { SocialFields } from "@/components/admin/social-fields";
import { BodyEditor } from "@/components/admin/body-editor";
import { EventStartInput, NoPageField } from "@/components/admin/no-page-field";
import { DateListField } from "@/components/admin/date-list-field";
import { requireAdmin } from "@/lib/auth-server";
import { getOrganisers, getVenues } from "@/content/repository";
import { listMedia } from "@/content/media";
import { createEvent } from "../../actions";

export const metadata: Metadata = {
  title: "Nieuw evenement",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const [params, venues, organisers, pool] = await Promise.all([
    searchParams,
    getVenues(),
    getOrganisers(),
    listMedia(),
  ]);

  return (
    <AdminShell>
      <h1 className="text-3xl">Nieuw evenement</h1>

      <FormError code={params.error} />

      <form action={createEvent} className="mt-8 grid max-w-2xl gap-5">
        <Field label="Titel" htmlFor="title" required>
          <Input id="title" name="title" required />
        </Field>

        <NoPageField />

        <Field label="Uitgelichte afbeelding" htmlFor="image" hint="Upload nieuw of kies uit de galerij. Optioneel, behalve bij Geen pagina.">
          <ImageField pool={pool} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Start" htmlFor="start" required>
            <EventStartInput />
          </Field>
          <div data-page-only>
            <Field label="Einde" htmlFor="end">
              <Input id="end" name="end" type="datetime-local" />
            </Field>
          </div>
        </div>

        <div data-page-only className="grid gap-5 sm:grid-cols-2">
          <Field label="Locatie" htmlFor="venue">
            <Select id="venue" name="venue" defaultValue="">
              <option value="">Geen locatie</option>
              {venues.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Organisatoren" htmlFor="organisers" hint="Geen, één of meer. Houd Ctrl/⌘ ingedrukt voor meerdere.">
            <Select id="organisers" name="organisers" multiple className="min-h-32">
              {organisers.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Herhaling" htmlFor="recurrence">
            <Select id="recurrence" name="recurrence" defaultValue="none">
              <option value="none">Eenmalig</option>
              <option value="weekly">Wekelijks</option>
              <option value="monthly">Maandelijks</option>
            </Select>
          </Field>
          <Field
            label="Herhalen tot en met"
            htmlFor="recurrenceUntil"
            hint="Verplicht bij een herhaling. Dit is de laatste dag waarop het evenement terugkomt — niet het eindtijdstip van één keer."
          >
            <Input id="recurrenceUntil" name="recurrenceUntil" type="date" />
          </Field>
        </div>

        <DateListField />

        <div data-page-only className="grid gap-5">
          <SocialFields />

          <Field label="Korte omschrijving" htmlFor="excerpt" hint="Voor lijsten en previews.">
            <Input id="excerpt" name="excerpt" />
          </Field>

          <Field label="Inhoud" htmlFor="body" hint="Markdown/MDX ondersteund.">
            <BodyEditor pool={pool} />
          </Field>
        </div>

        <CheckboxField name="publish" label="Direct publiceren" defaultChecked />
        <div>
          <SubmitButton>Opslaan</SubmitButton>
        </div>
      </form>
    </AdminShell>
  );
}
