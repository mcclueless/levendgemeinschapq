import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  CheckboxField,
  Field,
  Input,
  Select,
  SubmitButton,
  Textarea,
} from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { SocialFields } from "@/components/admin/social-fields";
import { requireAdmin } from "@/lib/auth-server";
import { getOrganisers, getVenues } from "@/content/repository";
import { listMedia } from "@/content/media";
import { createEvent } from "../../actions";

export const metadata: Metadata = {
  title: "Nieuw evenement",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  await requireAdmin();
  const [venues, organisers, pool] = await Promise.all([
    getVenues(),
    getOrganisers(),
    listMedia(),
  ]);

  return (
    <AdminShell>
      <h1 className="text-3xl">Nieuw evenement</h1>

      <form action={createEvent} className="mt-8 grid max-w-2xl gap-5">
        <Field label="Titel" htmlFor="title" required>
          <Input id="title" name="title" required />
        </Field>

        <Field label="Uitgelichte afbeelding" htmlFor="image" hint="Optioneel — upload nieuw of kies uit de galerij.">
          <ImageField pool={pool} />
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

        <Field label="Herhaling" htmlFor="recurrence">
          <Select id="recurrence" name="recurrence" defaultValue="none">
            <option value="none">Eenmalig</option>
            <option value="weekly">Wekelijks</option>
            <option value="monthly">Maandelijks</option>
          </Select>
        </Field>

        <SocialFields />

        <Field label="Korte omschrijving" htmlFor="excerpt" hint="Voor lijsten en previews.">
          <Input id="excerpt" name="excerpt" />
        </Field>

        <Field label="Inhoud" htmlFor="body" hint="Markdown/MDX ondersteund.">
          <Textarea id="body" name="body" />
        </Field>

        <CheckboxField name="publish" label="Direct publiceren" defaultChecked />
        <div>
          <SubmitButton>Opslaan</SubmitButton>
        </div>
      </form>
    </AdminShell>
  );
}
