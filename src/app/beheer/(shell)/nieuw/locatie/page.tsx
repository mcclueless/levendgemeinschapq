import type { Metadata } from "next";
import {
  CheckboxField,
  Field,
  Input,
  SubmitButton,
} from "@/components/admin/form";
import { ImageGuidance } from "@/components/admin/image-guidance";
import { ImageField } from "@/components/admin/image-field";
import { BodyEditor } from "@/components/admin/body-editor";
import { AddressAutocomplete } from "@/components/admin/address-autocomplete";
import { requireAdmin } from "@/lib/auth-server";
import { listMedia } from "@/content/media";
import { createVenue } from "@/app/beheer/actions";

export const metadata: Metadata = {
  title: "Nieuwe locatie",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function NewVenuePage() {
  await requireAdmin();
  const pool = await listMedia();

  return (
    <>
      <h1 className="text-3xl">Nieuwe locatie</h1>

      <form action={createVenue} className="mt-8 grid max-w-2xl gap-5">
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

        <Field label="Adres" htmlFor="address">
          <AddressAutocomplete />
        </Field>

        <Field label="Omslagafbeelding" htmlFor="image" info={<ImageGuidance kind="cover" />} hint="Optioneel — upload nieuw of kies uit de galerij.">
          <ImageField pool={pool} />
        </Field>

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
