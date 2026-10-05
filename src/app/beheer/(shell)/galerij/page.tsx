import type { Metadata } from "next";
import Link from "next/link";
import { FormError, Input, Select } from "@/components/admin/form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { MediaUploader } from "@/components/admin/media-uploader";
import { SelectAllButton } from "@/components/admin/media-extras";
import { Pagination } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireAdmin } from "@/lib/auth-server";
import { cn } from "@/lib/cn";
import { listMedia, type MediaItem } from "@/content/media";
import { mediaName } from "@/content/media-details";
import { loadImageUsers } from "@/content/admin";
import { imageUsage } from "@/content/image-references";
import {
  MEDIA_DEFAULT_DIR,
  applyMediaQuery,
  formatBytes,
  isMediaNarrowed,
  mediaLabel,
  mediaQueryString,
  parseMediaQuery,
  type MediaQuery,
  type MediaSort,
} from "@/content/media-query";
import { deleteMediaBulk } from "@/app/beheer/actions";

export const metadata: Metadata = { title: "Galerij", robots: { index: false } };
export const dynamic = "force-dynamic";

const GALLERY = "/beheer/galerij";

const MEDIA_MESSAGE: Record<string, string> = {
  geupload: "Afbeelding geüpload.",
  verwijderd: "Afbeelding verwijderd.",
};

const SORTS: Array<{ sort: MediaSort; label: string }> = [
  { sort: "datum", label: "Datum" },
  { sort: "naam", label: "Naam" },
  { sort: "grootte", label: "Grootte" },
];

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const raw = await searchParams;
  const one = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const media = one("media");
  const deleted = one("verwijderd");
  const kept = [raw.behouden ?? []].flat();

  // One read of all content tells, for every image at once, what uses it (D2).
  const [images, users] = await Promise.all([listMedia(), loadImageUsers()]);
  const usage = imageUsage(
    images.map((m) => m.url),
    users,
  );
  const inUse = new Set(images.filter((m) => usage.get(m.url)?.length).map((m) => m.url));

  // The view lives in the address (D1), and actions return to it.
  const query = parseMediaQuery(raw);
  const result = applyMediaQuery(images, inUse, query);
  const view = (overrides: Partial<MediaQuery> = {}) =>
    `${GALLERY}${mediaQueryString(query, overrides)}`;
  const here = view({ pagina: result.page });

  return (
    <>
      <h1 className="text-3xl">Galerij</h1>
      <p className="mt-2 text-muted">
        Alle geüploade afbeeldingen. Klik op een afbeelding voor de details, of
        verwijder afbeeldingen die nergens meer worden gebruikt.
      </p>

      <FormError code={one("error")} />

      {media && MEDIA_MESSAGE[media] ? (
        <Notice className="mt-4">{MEDIA_MESSAGE[media]}</Notice>
      ) : null}
      {media === "niets-gekozen" ? (
        <Notice tone="warning" className="mt-4">
          Kies eerst een of meer afbeeldingen om te verwijderen.
        </Notice>
      ) : null}
      {deleted !== undefined ? (
        <Notice className="mt-4">
          {deleted === "1" ? "1 afbeelding verwijderd." : `${Number(deleted) || 0} afbeeldingen verwijderd.`}
        </Notice>
      ) : null}
      {kept.length > 0 ? (
        <Notice tone="warning" role="alert" className="mt-4">
          Niet verwijderd, want nog in gebruik:{" "}
          {kept.map((name, i) => (
            <span key={name}>
              {i > 0 ? ", " : ""}
              <Link href={`${GALLERY}/${encodeURIComponent(name)}`} className="underline">
                {name}
              </Link>
            </span>
          ))}
          .
        </Notice>
      ) : null}

      <MediaUploader terug={here} />

      {images.length === 0 ? (
        <p className="mt-10 text-muted">Nog geen afbeeldingen geüpload.</p>
      ) : (
        <>
          {/* A plain GET form: the view is in the address, with or without
              JavaScript. The sort order rides along as hidden fields. */}
          <form action={GALLERY} role="search" className="mt-8 flex flex-wrap items-end gap-3">
            {query.sort !== "datum" ? <input type="hidden" name="sort" value={query.sort} /> : null}
            {query.dir !== MEDIA_DEFAULT_DIR[query.sort] ? (
              <input type="hidden" name="dir" value={query.dir} />
            ) : null}
            <div className="grid min-w-48 flex-1 gap-1.5 sm:max-w-xs">
              <label htmlFor="q" className="text-sm font-medium text-ink">
                Zoeken
              </label>
              <Input
                id="q"
                name="q"
                type="search"
                defaultValue={query.q}
                placeholder="Naam, titel, beschrijving of bijschrift"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="gebruik" className="text-sm font-medium text-ink">
                Gebruik
              </label>
              <Select id="gebruik" name="gebruik" defaultValue={query.gebruik ?? ""}>
                <option value="">Alle</option>
                <option value="gebruikt">In gebruik</option>
                <option value="ongebruikt">Niet in gebruik</option>
              </Select>
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2"
            >
              Filteren
            </button>
            {isMediaNarrowed(query) ? (
              <Link
                href={view({ q: "", gebruik: undefined })}
                className="inline-flex h-11 items-center text-sm font-medium text-brand-strong underline-offset-4 hover:underline"
              >
                Wissen
              </Link>
            ) : null}
          </form>

          {result.total === 0 ? (
            <p className="mt-8 text-muted">
              Niets gevonden.{" "}
              <Link href={GALLERY} className="font-medium text-brand-strong underline underline-offset-4">
                Toon alles
              </Link>
            </p>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted" role="status">
                  {result.total} {result.total === 1 ? "afbeelding" : "afbeeldingen"}
                  {result.pageCount > 1 ? ` · pagina ${result.page} van ${result.pageCount}` : null}
                </p>
                <nav aria-label="Sorteren">
                  <ul className="flex flex-wrap items-center gap-1 text-sm">
                    <li className="mr-1 text-muted">Sorteren:</li>
                    {SORTS.map(({ sort, label }) => {
                      const current = query.sort === sort;
                      // Choosing the current sort again turns it round.
                      const dir = current
                        ? query.dir === "asc"
                          ? "desc"
                          : "asc"
                        : MEDIA_DEFAULT_DIR[sort];
                      return (
                        <li key={sort}>
                          <Link
                            href={view({ sort, dir })}
                            aria-current={current ? "true" : undefined}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm px-2 py-1 underline-offset-4 hover:underline",
                              current ? "font-semibold text-ink" : "font-medium text-muted",
                            )}
                          >
                            {label}
                            {current ? (
                              <>
                                <span aria-hidden="true">{query.dir === "asc" ? "▲" : "▼"}</span>
                                <span className="sr-only">
                                  {query.dir === "asc" ? "(oplopend)" : "(aflopend)"}
                                </span>
                              </>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>

              {/* One form around the grid, for deleting several at once (D5).
                  Deleting a single image is done from its own page. */}
              <form action={deleteMediaBulk} className="mt-3">
                <input type="hidden" name="terug" value={here} />
                <div className="flex flex-wrap items-center gap-2">
                  <SelectAllButton />
                  <ConfirmButton
                    message="De geselecteerde afbeeldingen definitief verwijderen? Afbeeldingen die nog in gebruik zijn, blijven staan."
                    className="inline-flex h-9 items-center rounded-md border border-brand/50 bg-surface px-3 text-sm font-medium text-brand-strong hover:bg-brand/10"
                  >
                    Geselecteerde verwijderen
                  </ConfirmButton>
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {result.rows.map((m) => (
                    <MediaCard
                      key={m.key}
                      item={m}
                      uses={usage.get(m.url)?.length ?? 0}
                      href={`${GALLERY}/${encodeURIComponent(mediaName(m.key))}?terug=${encodeURIComponent(here)}`}
                    />
                  ))}
                </ul>
              </form>

              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                hrefs={Array.from({ length: result.pageCount }, (_, i) => view({ pagina: i + 1 }))}
              />
            </>
          )}
        </>
      )}
    </>
  );
}

function MediaCard({ item, uses, href }: { item: MediaItem; uses: number; href: string }) {
  const label = mediaLabel(item);
  return (
    <li className="overflow-hidden rounded-md border border-border bg-surface">
      <Link href={href} className="block focus-visible:outline-3 focus-visible:-outline-offset-2">
        {/* The name is in the link text below; the picture adds nothing to it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt=""
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
        <span className="block truncate px-3 pt-2 text-sm font-medium text-ink" title={label}>
          {label}
        </span>
      </Link>
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-1">
        <label className="flex min-w-0 items-center gap-2 text-xs text-muted">
          <input type="checkbox" name="keys" value={item.key} className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Selecteer<span className="sr-only"> {label}</span> · {formatBytes(item.size)}
          </span>
        </label>
        {uses > 0 ? (
          <Badge tone="success" className="shrink-0 px-2 py-0.5 text-xs">
            In gebruik
          </Badge>
        ) : (
          <Badge tone="neutral" className="shrink-0 px-2 py-0.5 text-xs">
            Niet in gebruik
          </Badge>
        )}
      </div>
    </li>
  );
}
