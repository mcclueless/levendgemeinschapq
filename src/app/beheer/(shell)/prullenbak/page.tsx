import type { Metadata } from "next";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { requireAdmin } from "@/lib/auth-server";
import { listTrash, purgeExpired, TRASH_RETENTION_DAYS } from "@/content/write";
import type { ContentType } from "@/content/schema";
import { adminEditPath } from "@/lib/routes";
import { formatDate } from "@/lib/date";
import { emptyTrash, purgeContent, restoreContent } from "@/app/beheer/actions";

export const metadata: Metadata = { title: "Prullenbak", robots: { index: false } };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<ContentType, string> = {
  event: "Evenement",
  venue: "Locatie",
  organiser: "Organisator",
  blog: "Blogpost",
  project: "Project",
};

function isType(s: string): s is ContentType {
  return s in TYPE_LABEL;
}

/**
 * The trash (content-trash spec). Opening it is also when expired items are
 * purged (D6): the app has no scheduler, and this is the one page where the
 * admin is looking at retention anyway, with each item's expiry date shown.
 */
export default async function TrashPage({
  searchParams,
}: {
  searchParams: Promise<{
    hersteld?: string;
    bezet?: string;
    door?: string;
    verwijderd?: string;
    geleegd?: string;
  }>;
}) {
  await requireAdmin();
  const { hersteld, bezet, door, verwijderd, geleegd } = await searchParams;
  await purgeExpired();
  const items = await listTrash();

  // ?bezet=<type>:<slug>&door=<title> — a restore refused because the slug is
  // live again; `door` names the item that holds it (D5).
  const [bezetType, bezetSlug] = bezet?.split(":") ?? [];
  const bezetItem =
    bezetType && isType(bezetType) && bezetSlug
      ? items.find((i) => i.type === bezetType && i.slug === bezetSlug)
      : undefined;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Prullenbak</h1>
        {items.length > 0 ? (
          <form action={emptyTrash}>
            <ConfirmButton
              message={`Alle ${items.length} item(s) in de prullenbak definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`}
              className="inline-flex h-10 items-center rounded-md border border-brand/50 bg-surface px-4 text-sm font-medium text-brand-strong hover:bg-brand/10"
            >
              Prullenbak leegmaken
            </ConfirmButton>
          </form>
        ) : null}
      </div>
      <p className="mt-2 text-muted">
        Verwijderde items blijven hier {TRASH_RETENTION_DAYS} dagen. Herstellen
        zet een item verborgen terug in zijn lijst; definitief verwijderen kan
        niet ongedaan worden gemaakt.
      </p>

      {hersteld ? (
        <Notice className="mt-4">
          “{hersteld}” hersteld als verborgen item. Publiceer het vanuit zijn lijst.
        </Notice>
      ) : null}
      {verwijderd ? <Notice className="mt-4">Definitief verwijderd.</Notice> : null}
      {geleegd ? (
        <Notice className="mt-4">
          Prullenbak geleegd ({geleegd} item{geleegd === "1" ? "" : "s"}).
        </Notice>
      ) : null}
      {bezet && bezetType && isType(bezetType) && bezetSlug ? (
        <Notice tone="warning" role="alert" className="mt-4">
          “{bezetItem?.title ?? bezetSlug}” kan niet hersteld worden: de permalink
          is nu in gebruik door{" "}
          <Link href={adminEditPath(bezetType, bezetSlug)} className="underline">
            {door ?? bezetSlug}
          </Link>
          . Wijzig de permalink van dat item, of verwijder het eerst.
        </Notice>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-10 text-muted">De prullenbak is leeg.</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {items.map((item) => (
            <Card as="li" key={`${item.type}-${item.slug}`} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="neutral">{TYPE_LABEL[item.type]}</Badge>
                  <span className="font-medium text-ink">{item.title}</span>
                  <span className="text-sm text-muted">
                    {item.trashedAt
                      ? `In prullenbak sinds ${formatDate(item.trashedAt)}`
                      : "Datum onbekend"}
                    {item.expiresAt ? ` · verloopt op ${formatDate(item.expiresAt)}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <form action={restoreContent}>
                    <input type="hidden" name="type" value={item.type} />
                    <input type="hidden" name="slug" value={item.slug} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-brand hover:bg-surface-2"
                    >
                      Herstellen
                    </button>
                  </form>
                  <form action={purgeContent}>
                    <input type="hidden" name="type" value={item.type} />
                    <input type="hidden" name="slug" value={item.slug} />
                    <ConfirmButton
                      message={`“${item.title}” definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`}
                      className="inline-flex h-9 items-center rounded-md border border-brand/50 bg-surface px-3 text-sm font-medium text-brand-strong hover:bg-brand/10"
                    >
                      Definitief verwijderen
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
