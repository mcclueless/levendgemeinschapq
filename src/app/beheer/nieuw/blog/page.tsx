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
import { requireAdmin } from "@/lib/auth-server";
import { getOrganisers, getVenues } from "@/content/repository";
import { createBlog } from "../../actions";

export const metadata: Metadata = {
  title: "Nieuwe blogpost",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function NewBlogPage() {
  await requireAdmin();
  const [venues, organisers] = await Promise.all([getVenues(), getOrganisers()]);

  return (
    <AdminShell>
      <h1 className="text-3xl">Nieuwe blogpost</h1>

      <form action={createBlog} className="mt-8 grid max-w-2xl gap-5">
        <Field label="Titel" htmlFor="title" required>
          <Input id="title" name="title" required />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Auteur" htmlFor="author" required>
            <Input id="author" name="author" required />
          </Field>
          <Field label="Datum" htmlFor="date" required>
            <Input id="date" name="date" type="date" required />
          </Field>
        </div>

        <Field label="Uitgelichte afbeelding" htmlFor="image" hint="Optioneel.">
          <Input id="image" name="image" type="file" accept="image/*" />
        </Field>

        <Field label="Korte omschrijving" htmlFor="excerpt">
          <Input id="excerpt" name="excerpt" />
        </Field>

        <Field label="Inhoud" htmlFor="body" hint="Markdown/MDX ondersteund.">
          <Textarea id="body" name="body" className="min-h-64" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Gekoppelde locaties"
            htmlFor="relatedVenues"
            hint="Optioneel — verschijnt als infoblok onderaan. Houd Ctrl/⌘ ingedrukt voor meerdere."
          >
            <Select id="relatedVenues" name="relatedVenues" multiple className="min-h-32">
              {venues.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Gekoppelde organisatoren"
            htmlFor="relatedOrganisers"
            hint="Optioneel — verschijnt als infoblok onderaan. Houd Ctrl/⌘ ingedrukt voor meerdere."
          >
            <Select
              id="relatedOrganisers"
              name="relatedOrganisers"
              multiple
              className="min-h-32"
            >
              {organisers.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </Select>
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
