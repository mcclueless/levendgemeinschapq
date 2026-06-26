import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { Field, Input, Select, SubmitButton } from "@/components/admin/form";
import { requireAdmin } from "@/lib/auth-server";
import { getOrganisers, getVenues } from "@/content/repository";
import { importCalendar } from "../actions";

export const metadata: Metadata = {
  title: "Agenda importeren",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    skipped?: string;
    flagged?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();
  const [params, venues, organisers] = await Promise.all([
    searchParams,
    getVenues(),
    getOrganisers(),
  ]);

  return (
    <AdminShell>
      <h1 className="text-3xl">Agenda importeren</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Importeer evenementen uit een Google Calendar- of iCal-link (.ics).
        Geïmporteerde evenementen komen als concept in de wachtrij voor controle.
      </p>

      {params.created !== undefined && !params.error ? (
        <p
          role="status"
          className="mt-4 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand"
        >
          Import klaar: {params.created} aangemaakt, {params.skipped} overgeslagen
          (al aanwezig), {params.flagged} gemarkeerd voor controle.
        </p>
      ) : null}
      {params.error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong"
        >
          {params.error}
        </p>
      ) : null}

      <form action={importCalendar} className="mt-8 grid max-w-2xl gap-5">
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
          <SubmitButton>Importeren</SubmitButton>
        </div>
      </form>
    </AdminShell>
  );
}
