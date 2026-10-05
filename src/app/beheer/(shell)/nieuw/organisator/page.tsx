import type { Metadata } from "next";
import {
  CheckboxField,
  Field,
  FormError,
  Input,
  Select,
  SubmitButton,
} from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { ImageListField } from "@/components/admin/image-list-field";
import { BodyEditor } from "@/components/admin/body-editor";
import { SocialFields } from "@/components/admin/social-fields";
import { requireAdmin } from "@/lib/auth-server";
import { getVenues } from "@/content/repository";
import { listMedia } from "@/content/media";
import { createOrganiser } from "@/app/beheer/actions";

export const metadata: Metadata = {
  title: "Nieuwe organisator",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function NewOrganiserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const [params, pool, venues] = await Promise.all([
    searchParams,
    listMedia(),
    getVenues(),
  ]);

  return (
    <>
      <h1 className="text-3xl">Nieuwe organisator</h1>

      <FormError code={params.error} />

      <form action={createOrganiser} className="mt-8 grid max-w-2xl gap-5">
        <Field label="Naam" htmlFor="name" required>
          <Input id="name" name="name" required />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Telefoon" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" />
          </Field>
          <Field label="E-mail" htmlFor="email">
            <Input id="email" name="email" type="email" />
          </Field>
        </div>

        <Field label="Website" htmlFor="website">
          <Input id="website" name="website" type="url" placeholder="https://" />
        </Field>

        <Field label="Locatie" htmlFor="location" hint="Optioneel — koppel een bestaande locatie.">
          <Select id="location" name="location" defaultValue="">
            <option value="">Geen locatie</option>
            {venues.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name}
              </option>
            ))}
          </Select>
        </Field>

        <fieldset className="grid gap-2 rounded-md border border-border p-4">
          <legend className="px-1 text-sm font-medium text-ink">Afbeeldingen</legend>
          <p className="text-xs text-muted">
            Op de pagina van de organisator als diavoorstelling. De eerste is de omslag in
            lijsten en bij delen. Een bijschrift hoort bij de afbeelding zelf en staat
            eronder in de diavoorstelling.
          </p>
          <ImageListField pool={pool} label="Afbeelding" />
        </fieldset>
        <Field label="Logo" htmlFor="logo" hint="Optioneel — naast de naam op de pagina van de organisator.">
          <ImageField pool={pool} urlName="logoUrl" fileName="logo" removable />
        </Field>

        <SocialFields />

        <Field label="Korte omschrijving" htmlFor="excerpt">
          <Input id="excerpt" name="excerpt" />
        </Field>

        <Field label="Beschrijving" htmlFor="body" hint="Markdown/MDX ondersteund.">
          <BodyEditor pool={pool} />
        </Field>

        <CheckboxField name="publish" label="Direct publiceren" defaultChecked />
        <div>
          <SubmitButton>Opslaan</SubmitButton>
        </div>
      </form>
    </>
  );
}
