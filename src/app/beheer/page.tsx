import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-server";
import { getContentCounts } from "@/content/admin";

export const metadata: Metadata = { title: "Beheer", robots: { index: false } };
export const dynamic = "force-dynamic";

const createLinks = [
  { href: "/beheer/nieuw/evenement", label: "Nieuw evenement" },
  { href: "/beheer/nieuw/locatie", label: "Nieuwe locatie" },
  { href: "/beheer/nieuw/organisator", label: "Nieuwe organisator" },
  { href: "/beheer/nieuw/blog", label: "Nieuwe blogpost" },
];

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const [{ created }, counts] = await Promise.all([
    searchParams,
    getContentCounts(),
  ]);

  return (
    <AdminShell>
      <h1 className="text-3xl">Overzicht</h1>

      {created ? (
        <p
          role="status"
          className="mt-4 rounded-md border border-forest/30 bg-forest/10 px-3 py-2 text-sm text-forest"
        >
          Opgeslagen ({created}).
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Evenementen" value={counts.events} />
        <Stat label="Locaties" value={counts.venues} />
        <Stat label="Organisatoren" value={counts.organisers} />
        <Stat label="Blogposts" value={counts.posts} />
        <Stat label="In wachtrij" value={counts.pending} highlight />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {createLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 font-medium hover:bg-sand"
          >
            {l.label}
          </Link>
        ))}
      </div>

      {counts.pending > 0 ? (
        <p className="mt-8">
          <Link
            href="/beheer/queue"
            className="font-medium text-terracotta-strong hover:underline"
          >
            {counts.pending} inzending(en) wachten op goedkeuring →
          </Link>
        </p>
      ) : null}
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted">
        {highlight && value > 0 ? <Badge tone="terracotta">{label}</Badge> : label}
      </div>
    </Card>
  );
}
