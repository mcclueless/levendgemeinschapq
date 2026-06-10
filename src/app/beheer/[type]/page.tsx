import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/card";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { requireAdmin } from "@/lib/auth-server";
import { listContent, findReferences } from "@/content/admin";
import { ADMIN_SEGMENT_TO_TYPE, type AdminSegment } from "@/lib/routes";
import { hideContent, showContent, deleteEvent } from "../actions";
import type { PublishStatus } from "@/content/schema";

export const metadata: Metadata = { title: "Beheren", robots: { index: false } };
export const dynamic = "force-dynamic";

const TITLES = {
  event: "Evenementen",
  venue: "Locaties",
  organiser: "Organisatoren",
  blog: "Blogposts",
} as const;

const NEW_LINK = {
  event: "/beheer/nieuw/evenement",
  venue: "/beheer/nieuw/locatie",
  organiser: "/beheer/nieuw/organisator",
  blog: "/beheer/nieuw/blog",
} as const;

const REF_KIND_LABEL = {
  event: "evenement",
  blog: "blog",
} as const;

function isSegment(s: string): s is AdminSegment {
  return s in ADMIN_SEGMENT_TO_TYPE;
}

function StatusBadge({ status }: { status: PublishStatus }) {
  if (status === "published") return <Badge tone="forest">Gepubliceerd</Badge>;
  if (status === "pending") return <Badge tone="terracotta">In wachtrij</Badge>;
  return <Badge tone="neutral">Verborgen</Badge>;
}

export default async function ManageListPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ blocked?: string }>;
}) {
  await requireAdmin();
  const { type: segment } = await params;
  if (!isSegment(segment)) notFound();
  const type = ADMIN_SEGMENT_TO_TYPE[segment];

  const [{ blocked }, items] = await Promise.all([
    searchParams,
    listContent(type),
  ]);
  const blockedRefs = blocked ? await findReferences(type, blocked) : [];
  const blockedItem = blocked ? items.find((i) => i.slug === blocked) : undefined;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">{TITLES[type]}</h1>
        <Link
          href={NEW_LINK[type]}
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-sand"
        >
          + Nieuw
        </Link>
      </div>

      {blocked && blockedRefs.length > 0 ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-strong"
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
                    className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-sand"
                  >
                    Bewerken
                  </Link>
                  {item.status === "published" ? (
                    <form action={hideContent}>
                      <input type="hidden" name="type" value={type} />
                      <input type="hidden" name="slug" value={item.slug} />
                      <ConfirmButton
                        message={`“${item.title}” verbergen van de website?`}
                        className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-terracotta-strong hover:bg-sand"
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
                        className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-forest hover:bg-sand"
                      >
                        Publiceren
                      </button>
                    </form>
                  )}
                  {type === "event" ? (
                    <form action={deleteEvent}>
                      <input type="hidden" name="slug" value={item.slug} />
                      <ConfirmButton
                        message={`“${item.title}” definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`}
                        className="inline-flex h-9 items-center rounded-md border border-terracotta/50 bg-surface px-3 text-sm font-medium text-terracotta-strong hover:bg-terracotta/10"
                      >
                        Verwijderen
                      </ConfirmButton>
                    </form>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
