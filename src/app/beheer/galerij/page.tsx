import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Field, SubmitButton } from "@/components/admin/form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Notice } from "@/components/ui/notice";
import { requireAdmin } from "@/lib/auth-server";
import { listMedia, type MediaItem } from "@/content/media";
import { findImageReferences, type ImageReference } from "@/content/admin";
import { uploadMedia, deleteMediaAction } from "../actions";

export const metadata: Metadata = { title: "Galerij", robots: { index: false } };
export const dynamic = "force-dynamic";

const MEDIA_MESSAGE: Record<string, string> = {
  geupload: "Afbeelding geüpload.",
  verwijderd: "Afbeelding verwijderd.",
};

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ media?: string; inuse?: string }>;
}) {
  await requireAdmin();
  const [{ media, inuse }, images] = await Promise.all([
    searchParams,
    listMedia(),
  ]);

  // For a blocked delete (?inuse=<key>), re-scan so we can name what uses it.
  const blocked = inuse ? images.find((m) => m.key === inuse) : undefined;
  const blockedRefs: ImageReference[] = blocked
    ? await findImageReferences(blocked.url)
    : [];

  return (
    <AdminShell>
      <h1 className="text-3xl">Galerij</h1>
      <p className="mt-2 text-muted">
        Alle geüploade afbeeldingen. Upload nieuwe of verwijder afbeeldingen die
        nergens meer worden gebruikt.
      </p>

      {media && MEDIA_MESSAGE[media] ? (
        <Notice className="mt-4">{MEDIA_MESSAGE[media]}</Notice>
      ) : null}

      {blocked ? (
        <Notice tone="warning" role="alert" className="mt-4">
          “{fileName(blocked.key)}” kan niet verwijderd worden: nog in gebruik
          door{" "}
          {blockedRefs.map((r, i) => (
            <span key={`${r.kind}-${r.slug}`}>
              {i > 0 ? ", " : ""}
              <Link href={r.href} className="underline">
                {r.title}
              </Link>
            </span>
          ))}
          .
        </Notice>
      ) : null}

      <form action={uploadMedia} className="mt-8 flex flex-wrap items-end gap-3">
        <Field label="Nieuwe afbeelding" htmlFor="image">
          <input
            id="image"
            type="file"
            name="image"
            accept="image/*"
            required
            className="text-sm"
          />
        </Field>
        <SubmitButton>Uploaden</SubmitButton>
      </form>

      {images.length === 0 ? (
        <p className="mt-10 text-muted">Nog geen afbeeldingen geüpload.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((m) => (
            <MediaCard key={m.key} item={m} />
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

function MediaCard({ item }: { item: MediaItem }) {
  return (
    <li className="overflow-hidden rounded-md border border-border bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt=""
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-xs text-muted" title={fileName(item.key)}>
          {fileName(item.key)}
        </span>
        <form action={deleteMediaAction}>
          <input type="hidden" name="key" value={item.key} />
          <input type="hidden" name="url" value={item.url} />
          <ConfirmButton
            message={`“${fileName(item.key)}” verwijderen?`}
            className="shrink-0 rounded-sm px-2 py-1 text-xs font-medium text-terracotta-strong hover:bg-sand"
          >
            Verwijderen
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}

/** "uploads/foo-123.jpg" → "foo-123.jpg" for display. */
function fileName(key: string): string {
  return key.replace(/^uploads\//, "");
}
