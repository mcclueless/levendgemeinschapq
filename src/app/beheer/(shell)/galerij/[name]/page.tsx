import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Field, FormError, Input, SubmitButton, Textarea } from "@/components/admin/form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CopyAddressButton, ImageDimensions } from "@/components/admin/media-extras";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireAdmin } from "@/lib/auth-server";
import { returnPath } from "@/lib/return-path";
import { listMedia } from "@/content/media";
import { mediaName } from "@/content/media-details";
import { formatBytes, mediaLabel } from "@/content/media-query";
import { findImageReferences } from "@/content/admin";
import {
  deleteMediaAction,
  replaceMediaAction,
  saveMediaDetailsAction,
} from "@/app/beheer/actions";

export const metadata: Metadata = { title: "Afbeelding", robots: { index: false } };
export const dynamic = "force-dynamic";

const GALLERY = "/beheer/galerij";

const MEDIA_MESSAGE: Record<string, string> = {
  opgeslagen: "Titel, beschrijving en bijschrift opgeslagen.",
  vervangen:
    "Bestand vervangen. Bezoekers die de oude afbeelding al hebben gezien, kunnen die nog even te zien krijgen.",
};

const KIND_LABEL = {
  event: "evenement",
  venue: "locatie",
  organiser: "organisator",
  blog: "blogpost",
  project: "project",
} as const;

const uploaded = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

/**
 * One image's own page (gallery-find-and-describe D3): a large view, what is
 * known about the file, where it is used, its title and description, and the
 * actions on it. A page rather than a dialog, so it has an address and works
 * without JavaScript.
 */
export default async function MediaItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ media?: string; error?: string; inuse?: string; terug?: string }>;
}) {
  await requireAdmin();
  const [{ name: rawName }, { media, error, inuse, terug }] = await Promise.all([
    params,
    searchParams,
  ]);
  const name = mediaName(rawName);
  const item = (await listMedia()).find((m) => m.key === `uploads/${name}`);
  if (!item) notFound();

  const users = await findImageReferences(item.url);
  const back = returnPath(terug, GALLERY);
  const label = mediaLabel(item);

  return (
    <>
      <p>
        <Link href={back} className="text-sm font-medium text-brand-strong underline-offset-4 hover:underline">
          ← Terug naar de galerij
        </Link>
      </p>
      <h1 className="mt-3 break-words text-3xl">{label}</h1>

      <FormError code={error} />
      {media && MEDIA_MESSAGE[media] ? <Notice className="mt-4">{MEDIA_MESSAGE[media]}</Notice> : null}
      {inuse ? (
        <Notice tone="warning" role="alert" className="mt-4">
          Deze afbeelding kan niet verwijderd worden: ze is nog in gebruik. Zie “Gebruikt in”.
        </Notice>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt={item.alt ?? ""}
            className="max-h-[70vh] w-auto max-w-full rounded-lg border border-border bg-surface-2"
          />

          <form action={saveMediaDetailsAction} className="mt-8 grid max-w-2xl gap-5">
            <input type="hidden" name="key" value={item.key} />
            {terug ? <input type="hidden" name="terug" value={terug} /> : null}
            <h2 className="text-xl">Titel, beschrijving en bijschrift</h2>
            <Field
              label="Titel"
              htmlFor="title"
              hint="Een herkenbare naam, in plaats van de bestandsnaam. Het adres van de afbeelding verandert niet."
            >
              <Input id="title" name="title" defaultValue={item.title ?? ""} />
            </Field>
            <Field
              label="Beschrijving (voor schermlezers)"
              htmlFor="alt"
              hint="Wat er op de afbeelding te zien is, voor wie de afbeelding niet kan zien. Wordt gebruikt waar de afbeelding als omslag, in een galerij of in een diavoorstelling staat."
            >
              <Textarea id="alt" name="alt" defaultValue={item.alt ?? ""} className="min-h-20" />
            </Field>
            <Field
              label="Bijschrift"
              htmlFor="caption"
              hint="Staat onder de afbeelding in een diavoorstelling, bijvoorbeeld op de pagina van een organisator."
            >
              <Input id="caption" name="caption" defaultValue={item.caption ?? ""} />
            </Field>
            <div>
              <SubmitButton>Opslaan</SubmitButton>
            </div>
          </form>
        </div>

        <div className="grid content-start gap-6">
          <Card className="p-5">
            <h2 className="text-lg">Bestand</h2>
            <dl className="mt-3 grid gap-3 text-sm">
              <div>
                <dt className="font-medium text-muted">Bestandsnaam</dt>
                <dd className="[overflow-wrap:anywhere]">{name}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Grootte</dt>
                <dd>{formatBytes(item.size)}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Afmetingen</dt>
                <dd>
                  <ImageDimensions url={item.url} />
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Geüpload of vervangen</dt>
                <dd>
                  <time dateTime={item.lastModified}>{uploaded.format(new Date(item.lastModified))}</time>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Adres</dt>
                <dd className="[overflow-wrap:anywhere]">
                  <a href={item.url} className="text-brand-strong underline underline-offset-4">
                    {item.url}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <CopyAddressButton url={item.url} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg">Gebruikt in</h2>
            {users.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Niet in gebruik.</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm">
                {users.map((u) => (
                  <li key={`${u.kind}-${u.slug}`}>
                    <Link href={u.href} className="font-medium text-brand-strong underline underline-offset-4">
                      {u.title}
                    </Link>{" "}
                    <span className="text-muted">({KIND_LABEL[u.kind]})</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-lg">Bestand vervangen</h2>
            <p className="mt-2 text-sm text-muted">
              Alles wat deze afbeelding gebruikt, toont daarna het nieuwe bestand. Het nieuwe
              bestand moet hetzelfde type zijn. Bezoekers kunnen de vorige afbeelding nog even te
              zien krijgen.
            </p>
            <form action={replaceMediaAction} className="mt-3 grid gap-3">
              <input type="hidden" name="key" value={item.key} />
              {terug ? <input type="hidden" name="terug" value={terug} /> : null}
              <label htmlFor="replacement" className="sr-only">
                Nieuw bestand
              </label>
              <input
                id="replacement"
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
                required
                className="text-sm"
              />
              <div>
                <ConfirmButton
                  message={`Het bestand van “${label}” vervangen? Het oude bestand gaat verloren.`}
                  className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-2"
                >
                  Vervangen
                </ConfirmButton>
              </div>
            </form>
          </Card>

          <form action={deleteMediaAction}>
            <input type="hidden" name="key" value={item.key} />
            {terug ? <input type="hidden" name="terug" value={terug} /> : null}
            <ConfirmButton
              message={`“${label}” definitief verwijderen?`}
              className="inline-flex h-9 items-center rounded-md border border-brand/50 bg-surface px-3 text-sm font-medium text-brand-strong hover:bg-brand/10"
            >
              Afbeelding verwijderen
            </ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
