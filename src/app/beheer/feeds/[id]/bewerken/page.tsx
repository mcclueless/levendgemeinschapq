import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  Field,
  FormError,
  Input,
  Select,
  SubmitButton,
} from "@/components/admin/form";
import { requireAdmin } from "@/lib/auth-server";
import { getFeed } from "@/content/feeds";
import { getOrganisers, getVenues } from "@/content/repository";
import { updateFeedAction } from "../../../actions";

export const metadata: Metadata = { title: "Feed bewerken", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const [feed, venues, organisers] = await Promise.all([
    getFeed(id),
    getVenues(),
    getOrganisers(),
  ]);
  if (!feed) notFound();

  return (
    <AdminShell>
      <h1 className="text-3xl">Feed bewerken</h1>
      <FormError code={error} />

      <form action={updateFeedAction} className="mt-8 grid max-w-2xl gap-5">
        <input type="hidden" name="id" value={feed.id} />

        <Field label="Naam" htmlFor="label" required hint="Alleen voor jezelf, in het overzicht.">
          <Input id="label" name="label" required defaultValue={feed.label} />
        </Field>

        <Field
          label="Agenda-URL"
          htmlFor="url"
          required
          hint="Een openbare Google Calendar- of iCal-link (.ics)."
        >
          <Input id="url" name="url" type="url" required defaultValue={feed.url} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Standaard locatie" htmlFor="defaultVenue" required>
            <Select
              id="defaultVenue"
              name="defaultVenue"
              required
              defaultValue={feed.defaultVenue}
            >
              {venues.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Standaard organisator" htmlFor="defaultOrganiser" required>
            <Select
              id="defaultOrganiser"
              name="defaultOrganiser"
              required
              defaultValue={feed.defaultOrganiser}
            >
              {organisers.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <SubmitButton>Opslaan</SubmitButton>
        </div>
      </form>
    </AdminShell>
  );
}
