import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/card";
import { Input } from "@/components/admin/form";
import { Mdx } from "@/components/mdx/mdx";
import { requireAdmin } from "@/lib/auth-server";
import { getPendingSubmissions, type Submission } from "@/content/admin";
import { formatDateLong, formatTime } from "@/lib/date";
import { recurrenceDetail } from "@/lib/recurrence-label";
import { approveSubmission, rejectSubmission } from "../actions";

export const metadata: Metadata = {
  title: "Wachtrij",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function QueuePage() {
  await requireAdmin();
  const submissions = await getPendingSubmissions();

  return (
    <AdminShell>
      <h1 className="text-3xl">Goedkeuringswachtrij</h1>
      <p className="mt-2 text-muted">
        Bekijk de volledige inzending en keur goed om te publiceren, of wijs af.
      </p>

      {submissions.length === 0 ? (
        <p className="mt-10 text-muted">Geen openstaande inzendingen. 🎉</p>
      ) : (
        <ul className="mt-8 grid gap-6">
          {submissions.map((s) => (
            <SubmissionCard key={`${s.kind}-${s.slug}`} submission={s} />
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

function when(start: string, end?: string): string {
  const s = new Date(start);
  const base = `${formatDateLong(s)} · ${formatTime(s)}`;
  return end ? `${base}–${formatTime(new Date(end))}` : base;
}

function SubmissionCard({ submission: s }: { submission: Submission }) {
  return (
    <Card as="li" className="overflow-hidden">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge tone={s.kind === "event" ? "accent" : "success"}>
              {s.kind === "event" ? "Evenement" : "Blog"}
            </Badge>
            <h2 className="text-xl">{s.title}</h2>
          </div>
          <p className="text-sm text-muted">
            {s.submittedBy ? `Ingediend door ${s.submittedBy}` : "Ingediend"}
            {s.submittedAt
              ? ` · ${new Date(s.submittedAt).toLocaleDateString("nl-NL")}`
              : ""}
          </p>
        </div>

        {s.reviewNote ? (
          <p className="rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong">
            Eerdere opmerking: {s.reviewNote}
          </p>
        ) : null}

        {s.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.featuredImage}
            alt={s.title}
            className="max-h-56 w-full rounded-md object-cover"
          />
        ) : null}

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {s.kind === "event" ? (
            <>
              <Detail label="Wanneer" value={when(s.start, s.end)} />
              <Detail label="Herhaling" value={recurrenceDetail(s.recurrence)} />
              {s.socials && Object.keys(s.socials).length ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted">Sociale links</dt>
                  <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(s.socials).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="underline underline-offset-2"
                      >
                        {platform}
                      </a>
                    ))}
                  </dd>
                </div>
              ) : null}
              <Detail label="Locatie" value={s.venueName} />
              <Detail label="Organisator" value={s.organiserName} />
            </>
          ) : (
            <>
              <Detail label="Auteur" value={s.author} />
              <Detail
                label="Datum"
                value={formatDateLong(new Date(s.date))}
              />
            </>
          )}
          {s.excerpt ? (
            <Detail label="Korte omschrijving" value={s.excerpt} wide />
          ) : null}
        </dl>

        {s.body.trim() ? (
          <div>
            <p className="mb-2 text-sm font-medium text-muted">Inhoud</p>
            <div className="rounded-md border border-border bg-canvas/60 p-4">
              <Mdx source={s.body} />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
          <form action={approveSubmission}>
            <input type="hidden" name="type" value={s.kind} />
            <input type="hidden" name="slug" value={s.slug} />
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:opacity-90"
            >
              Goedkeuren &amp; publiceren
            </button>
          </form>

          <form action={rejectSubmission} className="flex items-end gap-2">
            <input type="hidden" name="type" value={s.kind} />
            <input type="hidden" name="slug" value={s.slug} />
            <Input
              name="note"
              placeholder="Reden (optioneel)"
              aria-label="Reden van afwijzing"
              className="h-10 w-48"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
            >
              Afwijzen
            </button>
          </form>
        </div>
      </div>
    </Card>
  );
}

function Detail({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="font-medium text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
