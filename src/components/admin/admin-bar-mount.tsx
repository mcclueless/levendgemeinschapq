"use client";

import Link from "next/link";
import { deleteFromPublic, hideFromPublic } from "@/app/beheer/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { useAdminHint } from "@/components/admin/use-admin-hint";
import { Container } from "@/components/ui/container";
import type { ContentType } from "@/content/schema";

/**
 * Contextual admin banner mount (admin-presence spec).
 *
 * Rendered on public content-item pages with only non-secret context (type,
 * slug, title, edit href). It renders nothing during SSR and the first client
 * render — so cached markup is identical for everyone and contains no admin UI
 * — and reveals the dark ink banner only after hydration when the `lg_admin`
 * hint is present. Actions reuse the existing backend server actions; nothing
 * here edits content inline.
 */
export function AdminBarMount({
  type,
  slug,
  title,
  editHref,
}: {
  type: ContentType;
  slug: string;
  title: string;
  editHref: string;
}) {
  const isAdmin = useAdminHint();
  if (!isAdmin) return null;

  return (
    <div className="admin-chrome border-b border-admin-border">
      <Container className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
        <span className="flex items-center gap-2 text-sm">
          <span className="font-display font-semibold">Beheer</span>
          <span className="text-admin-fg/70">·</span>
          <span className="max-w-[16rem] truncate text-admin-fg/90" title={title}>
            {title}
          </span>
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link href={editHref} className="admin-chip">
            Bewerken
          </Link>

          <form action={hideFromPublic}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="slug" value={slug} />
            <ConfirmButton
              message={`“${title}” verbergen van de website?`}
              className="admin-chip"
            >
              Verbergen
            </ConfirmButton>
          </form>

          {type === "event" ? (
            <form action={deleteFromPublic}>
              <input type="hidden" name="slug" value={slug} />
              <ConfirmButton
                message={`“${title}” definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`}
                className="admin-chip admin-chip-danger"
              >
                Verwijderen
              </ConfirmButton>
            </form>
          ) : null}

          <Link
            href="/beheer/galerij"
            className="text-sm text-admin-fg/75 underline-offset-4 hover:text-admin-fg hover:underline"
          >
            Galerij
          </Link>
          <Link
            href="/beheer"
            className="text-sm text-admin-fg/75 underline-offset-4 hover:text-admin-fg hover:underline"
          >
            Overzicht
          </Link>
        </div>
      </Container>
    </div>
  );
}
