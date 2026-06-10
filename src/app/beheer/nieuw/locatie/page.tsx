import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  CheckboxField,
  Field,
  Input,
  SubmitButton,
  Textarea,
} from "@/components/admin/form";
import { requireAdmin } from "@/lib/auth-server";
import { createVenue } from "../../actions";

export const metadata: Metadata = {
  title: "Nieuwe locatie",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function NewVenuePage() {
  await requireAdmin();

  return (
    <AdminShell>
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
          <Input id="address" name="address" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Breedtegraad" htmlFor="lat" hint="Optioneel, voor de kaart.">
            <Input id="lat" name="lat" inputMode="decimal" />
          </Field>
          <Field label="Lengtegraad" htmlFor="lng" hint="Optioneel, voor de kaart.">
            <Input id="lng" name="lng" inputMode="decimal" />
          </Field>
        </div>

        <Field label="Omslagafbeelding" htmlFor="image" hint="Optioneel — getoond op de locatiepagina en in lijsten.">
          <Input id="image" name="image" type="file" accept="image/*" />
        </Field>

        <Field label="Korte omschrijving" htmlFor="excerpt">
          <Input id="excerpt" name="excerpt" />
        </Field>

        <Field label="Beschrijving" htmlFor="body" hint="Markdown/MDX ondersteund.">
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
