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
import { requireAdmin } from "@/lib/auth-server";
import { getOrganisers, getVenues } from "@/content/repository";
import { listMedia } from "@/content/media";
import { createProject } from "../../actions";

export const metadata: Metadata = {
  title: "Nieuw project",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  await requireAdmin();
  const [venues, organisers, pool] = await Promise.all([
    getVenues(),
    getOrganisers(),
    listMedia(),
  ]);

  return (
    <AdminShell>
      <h1 className="text-3xl">Nieuw project</h1>

      <form action={createProject} className="mt-8 grid max-w-2xl gap-5">
        <Field label="Titel" htmlFor="title" required>
          <Input id="title" name="title" required />
        </Field>

        <Field label="Uitgelichte afbeelding" htmlFor="image" hint="Optioneel — upload nieuw of kies uit de galerij.">
          <ImageField pool={pool} />
        </Field>

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

        <Field
          label="Organisatoren"
          htmlFor="organisers"
          required
          hint="Eén of meer. Houd Ctrl/⌘ ingedrukt voor meerdere."
        >
          <Select
            id="organisers"
            name="organisers"
            multiple
            required
            className="min-h-32"
          >
            {organisers.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Korte omschrijving" htmlFor="excerpt" hint="Voor lijsten en previews.">
          <Input id="excerpt" name="excerpt" />
        </Field>

        <Field label="Beschrijving" htmlFor="body" hint="Markdown/MDX ondersteund.">
          <Textarea id="body" name="body" className="min-h-64" />
        </Field>

        <CheckboxField name="publish" label="Direct publiceren" defaultChecked />
        <div>
          <SubmitButton>Opslaan</SubmitButton>
        </div>
      </form>
    </AdminShell>
  );
}
