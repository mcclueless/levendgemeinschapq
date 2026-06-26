import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/card";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { requireAdmin } from "@/lib/auth-server";
import { listContent, findReferences } from "@/content/admin";
import { ADMIN_SEGMENT_TO_TYPE, type AdminSegment } from "@/lib/routes";
import { hideContent, showContent, deleteContent } from "../actions";
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

const REF_KIND_LABEL = {
  event: "evenement",
  blog: "blog",
} as const;

function isSegment(s: string): s is AdminSegment {
  return s in ADMIN_SEGMENT_TO_TYPE;
}

function StatusBadge({ status }: { status: PublishStatus }) {
  if (status === "published") return <Badge tone="success">Gepubliceerd</Badge>;
  if (status === "pending") return <Badge tone="accent">In wachtrij</Badge>;
  return <Badge tone="neutral">Verborgen</Badge>;
}

export default async function ManageListPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ blocked?: string; undeletable?: string; geo?: string }>;
}) {
  await requireAdmin();
  const { type: segment } = await params;
  if (!isSegment(segment)) notFound();
  const type = ADMIN_SEGMENT_TO_TYPE[segment];

  const [{ blocked, undeletable, geo }, items] = await Promise.all([
    searchParams,
    listContent(type),
  ]);
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
    <AdminShell>
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
            nog gekoppeld aan andere content (ook verborgen items tellen mee).
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
        <ul className="mt-8 grid gap-3">
          {items.map((item) => (
            <Card as="li" key={item.slug} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} />
                  <span className="font-medium text-ink">{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/beheer/${segment}/${item.slug}/bewerken`}
                    className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-2"
                  >
                    Bewerken
                  </Link>
                  {item.status === "published" ? (
                    <form action={hideContent}>
                      <input type="hidden" name="type" value={type} />
                      <input type="hidden" name="slug" value={item.slug} />
                      <ConfirmButton
                        message={`“${item.title}” verbergen van de website?`}
                        className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-brand-strong hover:bg-surface-2"
                      >
                        Verbergen
                      </ConfirmButton>
                    </form>
                  ) : (
                    <form action={showContent}>
                      <input type="hidden" name="type" value={type} />
                      <input type="hidden" name="slug" value={item.slug} />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-brand hover:bg-surface-2"
                      >
                        Publiceren
                      </button>
                    </form>
                  )}
                  <form action={deleteContent}>
                    <input type="hidden" name="type" value={type} />
                    <input type="hidden" name="slug" value={item.slug} />
                    <ConfirmButton
                      message={`“${item.title}” definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`}
                      className="inline-flex h-9 items-center rounded-md border border-brand/50 bg-surface px-3 text-sm font-medium text-brand-strong hover:bg-brand/10"
                    >
                      Verwijderen
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
