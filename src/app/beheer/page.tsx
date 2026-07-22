import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-server";
import { getContentCounts } from "@/content/admin";
import { listFeeds } from "@/content/feeds";
import { adminListPath } from "@/lib/routes";

export const metadata: Metadata = { title: "Beheer", robots: { index: false } };
export const dynamic = "force-dynamic";

const createLinks = [
  { href: "/beheer/nieuw/evenement", label: "Nieuw evenement" },
  { href: "/beheer/nieuw/locatie", label: "Nieuwe locatie" },
  { href: "/beheer/nieuw/organisator", label: "Nieuwe organisator" },
  { href: "/beheer/nieuw/blog", label: "Nieuwe blogpost" },
  { href: "/beheer/nieuw/project", label: "Nieuw project" },
];

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; geo?: string }>;
}) {
  await requireAdmin();
  const [{ created, geo }, counts, feeds] = await Promise.all([
    searchParams,
    getContentCounts(),
    listFeeds(),
  ]);
  // Sync is manual and nothing notifies anyone, so a feed that has stopped
  // working is otherwise invisible — the dashboard is the one page an admin
  // reliably sees. Paused feeds are excluded: they are not expected to be
  // syncing, and reporting their stale failures would train people to ignore
  // this warning (add-managed-calendar-feeds D12).
  const brokenFeeds = feeds.filter((f) => f.lastError && !f.paused);

  return (
    <AdminShell>
      <h1 className="text-3xl">Overzicht</h1>

      {brokenFeeds.length ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong"
        >
          <p className="font-medium">
            {brokenFeeds.length === 1
              ? "Een agenda-feed kon niet worden gesynchroniseerd:"
              : `${brokenFeeds.length} agenda-feeds konden niet worden gesynchroniseerd:`}
          </p>
          <ul className="mt-1 grid gap-1">
            {brokenFeeds.map((f) => (
              <li key={f.id}>
                <span className="font-medium">{f.label}</span> — {f.lastError}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            <Link href="/beheer/feeds" className="underline underline-offset-2">
              Naar agenda-feeds
            </Link>
          </p>
        </div>
      ) : null}

      {created ? (
        <p
          role="status"
          className="mt-4 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand"
        >
          Opgeslagen ({created}).
        </p>
      ) : null}

      {geo === "notfound" ? (
        <p
          role="status"
          className="mt-3 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong"
        >
          Locatie niet gevonden voor dit adres — de kaart gebruikt het adres zelf.
          Controleer het adres als de kaart de verkeerde plek toont.
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Evenementen" value={counts.events} href={adminListPath("event")} />
        <Stat label="Locaties" value={counts.venues} href={adminListPath("venue")} />
        <Stat
          label="Organisatoren"
          value={counts.organisers}
          href={adminListPath("organiser")}
        />
        <Stat label="Blogposts" value={counts.posts} href={adminListPath("blog")} />
        <Stat label="Projecten" value={counts.projects} href={adminListPath("project")} />
        <Stat label="In wachtrij" value={counts.pending} href="/beheer/queue" highlight />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {createLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 font-medium hover:bg-surface-2"
          >
            {l.label}
          </Link>
        ))}
      </div>

      {counts.pending > 0 ? (
        <p className="mt-8">
          <Link
            href="/beheer/queue"
            className="font-medium text-brand-strong hover:underline"
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
  href,
  highlight,
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href} className="block rounded-lg focus-visible:outline-3 focus-visible:outline-offset-2">
      <Card className="p-5 transition-colors hover:bg-surface-2">
        <div className="text-3xl font-semibold">{value}</div>
        <div className="mt-1 text-sm text-muted">
          {highlight && value > 0 ? <Badge tone="brand">{label}</Badge> : label}
        </div>
      </Card>
    </Link>
  );
}
