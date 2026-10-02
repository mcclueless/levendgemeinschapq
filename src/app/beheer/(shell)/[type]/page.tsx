import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentTable } from "@/components/admin/content-table";
import { Pagination } from "@/components/admin/pagination";
import { Input, Select } from "@/components/admin/form";
import { requireAdmin } from "@/lib/auth-server";
import { listContent, findReferences, type ContentReference } from "@/content/admin";
import {
  applyListQuery,
  canBePending,
  hasRelationFilters,
  isNarrowed,
  listQueryString,
  parseListQuery,
  type ListQuery,
} from "@/content/list-query";
import { ADMIN_SEGMENT_TO_TYPE, adminListPath, type AdminSegment } from "@/lib/routes";
import { startOfToday } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { PublishStatus } from "@/content/schema";

export const metadata: Metadata = { title: "Beheren", robots: { index: false } };
export const dynamic = "force-dynamic";

const TITLES = {
  event: "Evenementen",
  venue: "Locaties",
  organiser: "Organisatoren",
  blog: "Blogposts",
  project: "Projecten",
} as const;

const NEW_LINK = {
  event: "/beheer/nieuw/evenement",
  venue: "/beheer/nieuw/locatie",
  organiser: "/beheer/nieuw/organisator",
  blog: "/beheer/nieuw/blog",
  project: "/beheer/nieuw/project",
} as const;

const REF_KIND_LABEL: Record<ContentReference["kind"], string> = {
  event: "evenement",
  project: "project",
  blog: "blog",
  organiser: "organisator",
  feed: "agenda-feed",
};

function isSegment(s: string): s is AdminSegment {
  return s in ADMIN_SEGMENT_TO_TYPE;
}

const STATUS_TABS: Array<{ status?: PublishStatus; label: string }> = [
  { label: "Alle" },
  { status: "published", label: "Gepubliceerd" },
  { status: "draft", label: "Verborgen" },
  { status: "pending", label: "In wachtrij" },
];

const byName = (a: { title: string }, b: { title: string }) =>
  a.title.localeCompare(b.title, "nl");

export default async function ManageListPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { type: segment } = await params;
  if (!isSegment(segment)) notFound();
  const type = ADMIN_SEGMENT_TO_TYPE[segment];
  const raw = await searchParams;
  const one = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const blocked = one("blocked");
  const undeletable = one("undeletable");
  const geo = one("geo");

  // Names for the location and organiser cells and filters. Only the types that
  // show them read the other lists; one request reads a type once (D2).
  const relations = hasRelationFilters(type);
  const [items, venues, organisers] = await Promise.all([
    listContent(type),
    relations || type === "organiser" ? listContent("venue") : Promise.resolve([]),
    relations ? listContent("organiser") : Promise.resolve([]),
  ]);
  const venueNames = new Map(venues.map((v) => [v.slug, v.title]));
  const organiserNames = new Map(organisers.map((o) => [o.slug, o.title]));

  // The view lives in the address (D4): read it, apply it, and keep the address
  // of what is shown so that actions can return to it (D6).
  const query: ListQuery = parseListQuery(type, raw);
  const result = applyListQuery(type, items, query, startOfToday());
  const listPath = adminListPath(type);
  const view = (overrides: Partial<ListQuery> = {}) =>
    `${listPath}${listQueryString(query, overrides)}`;
  const here = view({ pagina: result.page });
  const tabs = STATUS_TABS.filter((t) => t.status !== "pending" || canBePending(type));

  // Hide-block names the published referrers; delete-block names ALL referrers
  // (any status), so the two use distinct signals and reference scopes.
  const blockedRefs = blocked ? await findReferences(type, blocked) : [];
  const blockedItem = blocked ? items.find((i) => i.slug === blocked) : undefined;
  const undeletableRefs = undeletable
    ? await findReferences(type, undeletable, { includeHidden: true })
    : [];
  const undeletableItem = undeletable
    ? items.find((i) => i.slug === undeletable)
    : undefined;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">{TITLES[type]}</h1>
        <Link
          href={NEW_LINK[type]}
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2"
        >
          + Nieuw
        </Link>
      </div>

      {geo === "notfound" ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand-strong"
        >
          Locatie niet gevonden voor dit adres — de kaart gebruikt het adres zelf.
          Controleer het adres als de kaart de verkeerde plek toont.
        </p>
      ) : null}

      {blocked && blockedRefs.length > 0 ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand-strong"
        >
          <p className="font-medium">
            “{blockedItem?.title ?? blocked}” kan niet verborgen worden: nog
            gekoppeld aan gepubliceerde content.
          </p>
          <p className="mt-1">Verberg of ontkoppel eerst:</p>
          <ul className="mt-1 list-disc pl-5">
            {blockedRefs.map((r) => (
              <li key={`${r.kind}-${r.slug}`}>
                <Link href={r.href} className="underline">
                  {r.title}
                </Link>{" "}
                ({REF_KIND_LABEL[r.kind]})
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {undeletable && undeletableRefs.length > 0 ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand-strong"
        >
          <p className="font-medium">
            “{undeletableItem?.title ?? undeletable}” kan niet verwijderd worden:
            nog gekoppeld aan andere content of een agenda-feed (ook verborgen items
            tellen mee).
          </p>
          <p className="mt-1">Koppel deze eerst los of verwijder ze:</p>
          <ul className="mt-1 list-disc pl-5">
            {undeletableRefs.map((r) => (
              <li key={`${r.kind}-${r.slug}`}>
                <Link href={r.href} className="underline">
                  {r.title}
                </Link>{" "}
                ({REF_KIND_LABEL[r.kind]})
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-10 text-muted">Nog niets aangemaakt.</p>
      ) : (
        <>
          <nav aria-label="Status" className="mt-6">
            <ul className="flex flex-wrap gap-x-1 gap-y-2 border-b border-border">
              {tabs.map((tab) => {
                const current = query.status === tab.status;
                return (
                  <li key={tab.label}>
                    <Link
                      href={view({ status: tab.status })}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "-mb-px inline-block border-b-2 px-3 py-2 text-sm",
                        current
                          ? "border-brand font-semibold text-ink"
                          : "border-transparent font-medium text-muted hover:text-ink",
                      )}
                    >
                      {tab.label} ({result.counts[tab.status ?? "all"]})
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* A plain GET form: the view is in the address, with or without
              JavaScript. Status and sort order ride along as hidden fields. */}
          <form action={listPath} role="search" className="mt-5 flex flex-wrap items-end gap-3">
            {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
            {query.sort ? (
              <>
                <input type="hidden" name="sort" value={query.sort} />
                <input type="hidden" name="dir" value={query.dir} />
              </>
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
                placeholder={type === "venue" || type === "organiser" ? "Naam" : "Titel"}
              />
            </div>
            {type === "event" ? (
              <div className="grid gap-1.5">
                <label htmlFor="periode" className="text-sm font-medium text-ink">
                  Periode
                </label>
                <Select id="periode" name="periode" defaultValue={query.periode ?? ""}>
                  <option value="">Alle</option>
                  <option value="aankomend">Aankomend</option>
                  <option value="geweest">Geweest</option>
                </Select>
              </div>
            ) : null}
            {relations ? (
              <>
                <div className="grid gap-1.5">
                  <label htmlFor="locatie" className="text-sm font-medium text-ink">
                    Locatie
                  </label>
                  <Select id="locatie" name="locatie" defaultValue={query.locatie ?? ""}>
                    <option value="">Alle</option>
                    {[...venues].sort(byName).map((v) => (
                      <option key={v.slug} value={v.slug}>
                        {v.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="organisator" className="text-sm font-medium text-ink">
                    Organisator
                  </label>
                  <Select
                    id="organisator"
                    name="organisator"
                    defaultValue={query.organisator ?? ""}
                  >
                    <option value="">Alle</option>
                    {[...organisers].sort(byName).map((o) => (
                      <option key={o.slug} value={o.slug}>
                        {o.title}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            ) : null}
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2"
            >
              {relations ? "Filteren" : "Zoeken"}
            </button>
            {isNarrowed(query) ? (
              <Link
                href={view({ q: "", periode: undefined, locatie: undefined, organisator: undefined })}
                className="inline-flex h-11 items-center text-sm font-medium text-brand-strong underline-offset-4 hover:underline"
              >
                Wissen
              </Link>
            ) : null}
          </form>

          {result.total === 0 ? (
            <p className="mt-8 text-muted">
              Niets gevonden.{" "}
              <Link href={listPath} className="font-medium text-brand-strong underline underline-offset-4">
                Toon alles
              </Link>
            </p>
          ) : (
            <>
              <p className="mt-6 text-sm text-muted" role="status">
                {result.total} {result.total === 1 ? "item" : "items"}
                {result.pageCount > 1 ? ` · pagina ${result.page} van ${result.pageCount}` : null}
              </p>
              <div className="mt-3">
                <ContentTable
                  type={type}
                  rows={result.rows}
                  query={query}
                  listPath={listPath}
                  here={here}
                  venueNames={venueNames}
                  organiserNames={organiserNames}
                />
              </div>
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
