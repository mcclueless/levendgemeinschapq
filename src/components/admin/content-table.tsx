import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { hideContent, showContent, deleteContent } from "@/app/beheer/actions";
import { adminEditPath } from "@/lib/routes";
import { recurrenceLabel } from "@/lib/recurrence-label";
import { cn } from "@/lib/cn";
import type { ContentType, PublishStatus } from "@/content/schema";
import type { ContentSummary } from "@/content/summaries";
import {
  DEFAULT_DIR,
  isDated,
  listQueryString,
  type ListDir,
  type ListQuery,
  type ListSort,
} from "@/content/list-query";

/**
 * The backend management table (admin-content-table D5): one row per item, with
 * the columns its type has, sortable headers, and the row's actions under its
 * title.
 */

type ColumnKey = "titel" | "datum" | "auteur" | "adres" | "locatie" | "organisatoren" | "status" | "gewijzigd";

interface Column {
  key: ColumnKey;
  label: string;
  /** The `sort` value this column's header sets; absent when it cannot sort. */
  sort?: ListSort;
}

const col = (key: ColumnKey, label: string, sort?: ListSort): Column => ({ key, label, sort });
const STATUS = col("status", "Status", "status");
const MODIFIED = col("gewijzigd", "Gewijzigd", "gewijzigd");

const COLUMNS: Record<ContentType, Column[]> = {
  event: [
    col("titel", "Titel", "titel"),
    col("datum", "Datum", "datum"),
    col("locatie", "Locatie"),
    col("organisatoren", "Organisatoren"),
    STATUS,
    MODIFIED,
  ],
  blog: [
    col("titel", "Titel", "titel"),
    col("datum", "Datum", "datum"),
    col("auteur", "Auteur"),
    STATUS,
    MODIFIED,
  ],
  // A project's date is stamped when it is created; it is what the list is
  // ordered by, so it is shown under that name.
  project: [
    col("titel", "Titel", "titel"),
    col("datum", "Aangemaakt", "datum"),
    col("locatie", "Locatie"),
    col("organisatoren", "Organisatoren"),
    STATUS,
    MODIFIED,
  ],
  venue: [col("titel", "Naam", "titel"), col("adres", "Adres"), STATUS, MODIFIED],
  organiser: [col("titel", "Naam", "titel"), col("locatie", "Locatie"), STATUS, MODIFIED],
};

// The backend shows the year: a list spans past and coming years alike.
const TZ = "Europe/Amsterdam";
const dayFmt = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});
const timeFmt = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

function When({ date, time = false }: { date?: Date; time?: boolean }) {
  if (!date) return <>—</>;
  return (
    <time dateTime={date.toISOString()} className="whitespace-nowrap">
      {dayFmt.format(date)}
      {time ? `, ${timeFmt.format(date)}` : null}
    </time>
  );
}

export function StatusBadge({ status }: { status: PublishStatus }) {
  if (status === "published") return <Badge tone="success">Gepubliceerd</Badge>;
  if (status === "pending") return <Badge tone="accent">In wachtrij</Badge>;
  return <Badge tone="neutral">Verborgen</Badge>;
}

/** Names for slugs; a slug with no record reads as unknown, as in the queue. */
function names(slugs: string[], bySlug: ReadonlyMap<string, string>): string {
  if (slugs.length === 0) return "—";
  return slugs.map((slug) => bySlug.get(slug) ?? `${slug} (onbekend)`).join(", ");
}

/**
 * One cell. Below `xl` rows stack into blocks and each cell shows its column
 * name inline; that label is `aria-hidden` because the (visually hidden) header
 * row already names the column for assistive technology — the same approach as
 * the public agenda table (event-list-table-view D5).
 */
function Cell({
  label,
  header = false,
  className,
  children,
}: {
  label: string;
  header?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = header ? "th" : "td";
  return (
    <Tag
      role={header ? "rowheader" : "cell"}
      scope={header ? "row" : undefined}
      className={cn(
        "flex gap-3 py-0.5 text-left font-normal xl:table-cell xl:px-3 xl:py-3 xl:align-top",
        className,
      )}
    >
      <span aria-hidden="true" className="w-28 shrink-0 text-sm text-muted xl:hidden">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </Tag>
  );
}

const action = "whitespace-nowrap text-sm font-medium underline-offset-4 hover:underline";

export function ContentTable({
  type,
  rows,
  query,
  listPath,
  here,
  venueNames,
  organiserNames,
}: {
  type: ContentType;
  rows: ContentSummary[];
  query: ListQuery;
  /** The list's own path, without a view. */
  listPath: string;
  /** The list's address with the current view: where actions return to (D6). */
  here: string;
  venueNames: ReadonlyMap<string, string>;
  organiserNames: ReadonlyMap<string, string>;
}) {
  const columns = COLUMNS[type];
  // The order in effect, also when none was chosen: the type's default.
  const sorted: ListSort = query.sort ?? (isDated(type) ? "datum" : "titel");
  const sortedDir: ListDir = query.sort ? query.dir : DEFAULT_DIR[sorted];

  return (
    <table role="table" className="block w-full text-left xl:table xl:border-collapse xl:text-sm">
      <caption className="sr-only">Overzicht, sorteerbaar via de kolomkoppen</caption>
      <thead className="sr-only xl:not-sr-only xl:table-header-group">
        <tr role="row" className="xl:border-b xl:border-border">
          {columns.map((c) => {
            const isSorted = c.sort === sorted;
            // Choosing the sorted column again turns it round; another column
            // starts in its own direction.
            const dir: ListDir | undefined = c.sort
              ? isSorted
                ? sortedDir === "asc"
                  ? "desc"
                  : "asc"
                : DEFAULT_DIR[c.sort]
              : undefined;
            return (
              <th
                key={c.key}
                role="columnheader"
                scope="col"
                aria-sort={
                  isSorted ? (sortedDir === "asc" ? "ascending" : "descending") : undefined
                }
                className="text-sm font-medium text-muted xl:px-3 xl:py-2"
              >
                {c.sort ? (
                  <Link
                    href={`${listPath}${listQueryString(query, { sort: c.sort, dir })}`}
                    className={cn(
                      "inline-flex items-center gap-1 underline-offset-4 hover:underline",
                      isSorted && "text-ink",
                    )}
                  >
                    {c.label}
                    {isSorted ? (
                      <span aria-hidden="true">{sortedDir === "asc" ? "▲" : "▼"}</span>
                    ) : null}
                  </Link>
                ) : (
                  c.label
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="block rounded-lg border border-border bg-surface px-4 xl:table-row-group xl:px-0">
        {rows.map((item) => {
          const editHref = `${adminEditPath(type, item.slug)}?terug=${encodeURIComponent(here)}`;
          // A hidden item's page is not found, and a marker has none.
          const hasPage = item.status === "published" && !item.noPage;
          return (
            <tr
              key={item.slug}
              role="row"
              className="block border-b border-border py-3 last:border-0 xl:table-row xl:py-0"
            >
              {columns.map((c) => {
                switch (c.key) {
                  case "titel":
                    return (
                      <Cell key={c.key} label={c.label} header className="xl:min-w-80">
                        <Link
                          href={editHref}
                          className="font-medium text-ink underline-offset-4 hover:underline"
                        >
                          {item.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <Link href={editHref} className={cn(action, "text-brand-strong")}>
                            Bewerken
                          </Link>
                          {hasPage ? (
                            <Link href={item.href} className={cn(action, "text-brand-strong")}>
                              Bekijken
                            </Link>
                          ) : null}
                          {item.status === "published" ? (
                            <form action={hideContent}>
                              <input type="hidden" name="type" value={type} />
                              <input type="hidden" name="slug" value={item.slug} />
                              <input type="hidden" name="terug" value={here} />
                              <ConfirmButton
                                message={`“${item.title}” verbergen van de website?`}
                                className={cn(action, "text-brand-strong")}
                              >
                                Verbergen
                              </ConfirmButton>
                            </form>
                          ) : (
                            <form action={showContent}>
                              <input type="hidden" name="type" value={type} />
                              <input type="hidden" name="slug" value={item.slug} />
                              <input type="hidden" name="terug" value={here} />
                              <button type="submit" className={cn(action, "text-brand")}>
                                Publiceren
                              </button>
                            </form>
                          )}
                          <form action={deleteContent}>
                            <input type="hidden" name="type" value={type} />
                            <input type="hidden" name="slug" value={item.slug} />
                            <input type="hidden" name="terug" value={here} />
                            <ConfirmButton
                              message={`“${item.title}” definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`}
                              className={cn(action, "text-brand-strong")}
                            >
                              Verwijderen
                            </ConfirmButton>
                          </form>
                        </div>
                      </Cell>
                    );
                  case "datum": {
                    const further = item.dates?.length ?? 0;
                    const repeats =
                      recurrenceLabel(item.recurrence) ??
                      (further > 0 ? `+ ${further} ${further === 1 ? "datum" : "data"}` : undefined);
                    return (
                      <Cell key={c.key} label={c.label}>
                        {/* A marker is about a day, not a time (event-no-page D3). */}
                        <When date={item.start ?? item.date} time={type === "event" && !item.noPage} />
                        {repeats ? <span className="block text-sm text-muted">{repeats}</span> : null}
                        {item.noPage ? (
                          <Badge tone="neutral" className="mt-1">
                            Geen pagina
                          </Badge>
                        ) : null}
                      </Cell>
                    );
                  }
                  case "auteur":
                    return (
                      <Cell key={c.key} label={c.label}>
                        {item.author ?? "—"}
                      </Cell>
                    );
                  case "adres":
                    return (
                      <Cell key={c.key} label={c.label}>
                        {item.address ?? "—"}
                      </Cell>
                    );
                  case "locatie":
                    return (
                      <Cell key={c.key} label={c.label}>
                        {names(item.venues, venueNames)}
                      </Cell>
                    );
                  case "organisatoren":
                    return (
                      <Cell key={c.key} label={c.label}>
                        {names(item.organisers, organiserNames)}
                      </Cell>
                    );
                  case "status":
                    return (
                      <Cell key={c.key} label={c.label}>
                        <StatusBadge status={item.status} />
                      </Cell>
                    );
                  case "gewijzigd":
                    return (
                      <Cell key={c.key} label={c.label} className="text-sm text-muted">
                        <When date={item.modified} time />
                      </Cell>
                    );
                }
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
