import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/admin/form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { requireAdmin } from "@/lib/auth-server";
import { listFeeds, type Feed } from "@/content/feeds";
import { formatDateLong } from "@/lib/date";
import {
  deleteFeedAction,
  syncAllFeedsAction,
  syncFeedAction,
  toggleFeedPausedAction,
} from "../actions";

export const metadata: Metadata = { title: "Agenda-feeds", robots: { index: false } };
export const dynamic = "force-dynamic";

function lastRun(f: Feed): string {
  if (!f.lastSyncedAt) return "Nog niet gesynchroniseerd";
  const when = formatDateLong(new Date(f.lastSyncedAt));
  if (f.lastError) return `Laatste sync mislukt · ${when}`;
  const parts = [
    `${f.lastCreated ?? 0} nieuw`,
    `${f.lastSkipped ?? 0} overgeslagen`,
  ];
  if (f.lastSkippedPast) parts.push(`${f.lastSkippedPast} verlopen`);
  if (f.lastHidden) parts.push(`${f.lastHidden} verborgen`);
  if (f.lastFlagged) parts.push(`${f.lastFlagged} gemarkeerd`);
  return `${parts.join(", ")} · ${when}`;
}

export default async function FeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; deleted?: string; synced?: string }>;
}) {
  await requireAdmin();
  const [{ created, deleted, synced }, feeds] = await Promise.all([
    searchParams,
    listFeeds(),
  ]);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Agenda-feeds</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/beheer/import"
            className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 font-medium hover:bg-surface-2"
          >
            Feed toevoegen
          </Link>
          {feeds.some((f) => !f.paused) ? (
            <form action={syncAllFeedsAction}>
              <SubmitButton>Sync alle</SubmitButton>
            </form>
          ) : null}
        </div>
      </div>

      <p className="mt-2 max-w-2xl text-muted">
        Opgeslagen Google Calendar- of iCal-links. Synchroniseren haalt nieuwe
        evenementen op als concept in de wachtrij; evenementen die je hier al
        hebt aangepast blijven ongewijzigd.
      </p>

      {created ? <Notice className="mt-4">Feed opgeslagen.</Notice> : null}
      {deleted ? (
        <Notice className="mt-4">
          Feed verwijderd. De eerder geïmporteerde evenementen zijn ongewijzigd
          gebleven.
        </Notice>
      ) : null}
      {synced ? (
        <Notice className="mt-4">
          {synced === "alle"
            ? "Alle actieve feeds zijn gesynchroniseerd — zie het resultaat per feed hieronder."
            : "Feed gesynchroniseerd — zie het resultaat hieronder."}
        </Notice>
      ) : null}

      {feeds.length === 0 ? (
        <Notice tone="warning" className="mt-8">
          Nog geen feeds opgeslagen.{" "}
          <Link href="/beheer/import" className="underline underline-offset-2">
            Voeg er een toe
          </Link>
          .
        </Notice>
      ) : (
        <ul className="mt-8 grid gap-4">
          {feeds.map((f) => (
            <Card as="li" key={f.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg">{f.label}</h2>
                    {f.paused ? <Badge tone="neutral">Gepauzeerd</Badge> : null}
                    {f.lastError ? <Badge tone="accent">Fout</Badge> : null}
                  </div>
                  <p className="mt-1 break-all text-sm text-muted">{f.url}</p>
                  <p className="mt-1 text-sm text-muted">
                    Standaard: {f.defaultVenue} · {f.defaultOrganiser}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={syncFeedAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <SubmitButton>Sync nu</SubmitButton>
                  </form>
                  <form action={toggleFeedPausedAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 font-medium hover:bg-surface-2"
                    >
                      {f.paused ? "Hervatten" : "Pauzeren"}
                    </button>
                  </form>
                  <Link
                    href={`/beheer/feeds/${f.id}/bewerken`}
                    className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 font-medium hover:bg-surface-2"
                  >
                    Bewerken
                  </Link>
                  <form action={deleteFeedAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <ConfirmButton
                      message="Deze feed verwijderen? De eerder geïmporteerde evenementen blijven staan."
                      className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 font-medium text-brand-strong hover:bg-surface-2"
                    >
                      Verwijderen
                    </ConfirmButton>
                  </form>
                </div>
              </div>

              <p className="mt-3 text-sm text-muted">{lastRun(f)}</p>
              {f.lastError ? (
                <Notice tone="warning" role="alert" className="mt-3">
                  {f.lastError}
                </Notice>
              ) : null}
            </Card>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
