import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  Field,
  Input,
  Select,
  SubmitButton,
  Textarea,
} from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { requireAdmin } from "@/lib/auth-server";
import { getEditable } from "@/content/admin";
import { getOrganisers, getVenues } from "@/content/repository";
import { listMedia } from "@/content/media";
import { ADMIN_SEGMENT_TO_TYPE, type AdminSegment } from "@/lib/routes";
import {
  updateBlog,
  updateEvent,
  updateOrganiser,
  updateVenue,
} from "../../../actions";

export const metadata: Metadata = { title: "Bewerken", robots: { index: false } };
export const dynamic = "force-dynamic";

function isSegment(s: string): s is AdminSegment {
  return s in ADMIN_SEGMENT_TO_TYPE;
}

// Frontmatter stores datetimes two ways: fixtures use full ISO with an offset
// (gray-matter parses these to a Date), while the create form stores a bare
// "YYYY-MM-DDTHH:mm" wall-time string (kept as a string). For a Date we render
// the wall time in the site timezone; a string is already wall time, so slice.
const TZ = "Europe/Amsterdam";
const wall = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Stored datetime → "YYYY-MM-DDTHH:mm" for <input type="datetime-local">. */
function toDatetimeLocal(v: unknown): string {
  if (v instanceof Date) return wall.format(v).replace(" ", "T");
  if (typeof v === "string") return v.slice(0, 16);
  return "";
}

/** Stored date → "YYYY-MM-DD" for <input type="date">. */
function toDateInput(v: unknown): string {
  if (v instanceof Date) return wall.format(v).slice(0, 10);
  if (typeof v === "string") return v.slice(0, 10);
  return "";
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  await requireAdmin();
  const { type: segment, slug } = await params;
  if (!isSegment(segment)) notFound();
  const type = ADMIN_SEGMENT_TO_TYPE[segment];
  const pool = await listMedia();

  const formClass = "mt-8 grid max-w-2xl gap-5";

  if (type === "event") {
    const [doc, venues, organisers] = await Promise.all([
      getEditable("event", slug),
      getVenues(),
      getOrganisers(),
    ]);
    if (!doc) notFound();
    const d = doc.data;
    return (
      <AdminShell>
        <h1 className="text-3xl">Evenement bewerken</h1>
        <form action={updateEvent} className={formClass}>
          <input type="hidden" name="slug" value={slug} />
          <Field label="Titel" htmlFor="title" required>
            <Input id="title" name="title" required defaultValue={d.title} />
          </Field>
          <Field label="Uitgelichte afbeelding" htmlFor="image">
            <ImageField pool={pool} current={d.featuredImage} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Start" htmlFor="start" required>
              <Input
                id="start"
                name="start"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocal(doc.fm.start)}
              />
            </Field>
            <Field label="Einde" htmlFor="end">
              <Input
                id="end"
                name="end"
                type="datetime-local"
                defaultValue={toDatetimeLocal(doc.fm.end)}
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Locatie" htmlFor="venue" required>
              <Select id="venue" name="venue" required defaultValue={d.venue}>
                {venues.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Organisator" htmlFor="organiser" required>
              <Select
                id="organiser"
                name="organiser"
                required
                defaultValue={d.organiser}
              >
                {organisers.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Herhaling" htmlFor="recurrence">
            <Select
              id="recurrence"
              name="recurrence"
              defaultValue={d.recurrence?.freq ?? "none"}
            >
              <option value="none">Eenmalig</option>
              <option value="weekly">Wekelijks</option>
              <option value="monthly">Maandelijks</option>
            </Select>
          </Field>
          <Field label="Korte omschrijving" htmlFor="excerpt">
            <Input id="excerpt" name="excerpt" defaultValue={d.excerpt} />
          </Field>
          <Field label="Inhoud" htmlFor="body" hint="Markdown/MDX ondersteund.">
            <Textarea id="body" name="body" defaultValue={doc.body.trim()} />
          </Field>
          <div>
            <SubmitButton>Opslaan</SubmitButton>
          </div>
        </form>
      </AdminShell>
    );
  }

  if (type === "venue") {
    const doc = await getEditable("venue", slug);
    if (!doc) notFound();
    const d = doc.data;
    return (
      <AdminShell>
        <h1 className="text-3xl">Locatie bewerken</h1>
        <form action={updateVenue} className={formClass}>
          <input type="hidden" name="slug" value={slug} />
          <Field label="Naam" htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={d.name} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Telefoon" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" defaultValue={d.phone} />
            </Field>
            <Field label="E-mail" htmlFor="email">
              <Input id="email" name="email" type="email" defaultValue={d.email} />
            </Field>
          </div>
          <Field label="Website" htmlFor="website">
            <Input id="website" name="website" type="url" defaultValue={d.website} />
          </Field>
          <Field
            label="Adres"
            htmlFor="address"
            hint="De locatie op de kaart wordt automatisch bepaald uit het adres."
          >
            <Input id="address" name="address" defaultValue={d.address} />
          </Field>
          <Field label="Omslagafbeelding" htmlFor="image">
            <ImageField pool={pool} current={d.featuredImage} />
          </Field>
          <Field label="Korte omschrijving" htmlFor="excerpt">
            <Input id="excerpt" name="excerpt" defaultValue={d.excerpt} />
          </Field>
          <Field label="Beschrijving" htmlFor="body" hint="Markdown/MDX ondersteund.">
            <Textarea id="body" name="body" defaultValue={doc.body.trim()} />
          </Field>
          <div>
            <SubmitButton>Opslaan</SubmitButton>
          </div>
        </form>
      </AdminShell>
    );
  }

  if (type === "organiser") {
    const doc = await getEditable("organiser", slug);
    if (!doc) notFound();
    const d = doc.data;
    return (
      <AdminShell>
        <h1 className="text-3xl">Organisator bewerken</h1>
        <form action={updateOrganiser} className={formClass}>
          <input type="hidden" name="slug" value={slug} />
          <Field label="Naam" htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={d.name} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Telefoon" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" defaultValue={d.phone} />
            </Field>
            <Field label="E-mail" htmlFor="email">
              <Input id="email" name="email" type="email" defaultValue={d.email} />
            </Field>
          </div>
          <Field label="Website" htmlFor="website">
            <Input id="website" name="website" type="url" defaultValue={d.website} />
          </Field>
          <Field label="Omslagafbeelding" htmlFor="image">
            <ImageField pool={pool} current={d.featuredImage} />
          </Field>
          <Field label="Korte omschrijving" htmlFor="excerpt">
            <Input id="excerpt" name="excerpt" defaultValue={d.excerpt} />
          </Field>
          <Field label="Beschrijving" htmlFor="body" hint="Markdown/MDX ondersteund.">
            <Textarea id="body" name="body" defaultValue={doc.body.trim()} />
          </Field>
          <div>
            <SubmitButton>Opslaan</SubmitButton>
          </div>
        </form>
      </AdminShell>
    );
  }

  // blog
  const [doc, venues, organisers] = await Promise.all([
    getEditable("blog", slug),
    getVenues(),
    getOrganisers(),
  ]);
  if (!doc) notFound();
  const d = doc.data;
  return (
    <AdminShell>
      <h1 className="text-3xl">Blogpost bewerken</h1>
      <form action={updateBlog} className={formClass}>
        <input type="hidden" name="slug" value={slug} />
        <Field label="Titel" htmlFor="title" required>
          <Input id="title" name="title" required defaultValue={d.title} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Auteur" htmlFor="author" required>
            <Input id="author" name="author" required defaultValue={d.author} />
          </Field>
          <Field label="Datum" htmlFor="date" required>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={toDateInput(doc.fm.date)}
            />
          </Field>
        </div>
        <Field label="Uitgelichte afbeelding" htmlFor="image">
          <ImageField pool={pool} current={d.featuredImage} />
        </Field>
        <Field label="Korte omschrijving" htmlFor="excerpt">
          <Input id="excerpt" name="excerpt" defaultValue={d.excerpt} />
        </Field>
        <Field label="Inhoud" htmlFor="body" hint="Markdown/MDX ondersteund.">
          <Textarea id="body" name="body" className="min-h-64" defaultValue={doc.body.trim()} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Gekoppelde locaties"
            htmlFor="relatedVenues"
            hint="Houd Ctrl/⌘ ingedrukt voor meerdere."
          >
            <Select
              id="relatedVenues"
              name="relatedVenues"
              multiple
              className="min-h-32"
              defaultValue={d.relatedVenues}
            >
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
            hint="Houd Ctrl/⌘ ingedrukt voor meerdere."
          >
            <Select
              id="relatedOrganisers"
              name="relatedOrganisers"
              multiple
              className="min-h-32"
              defaultValue={d.relatedOrganisers}
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
