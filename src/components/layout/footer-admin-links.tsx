"use client";

import Link from "next/link";
import { logout } from "@/app/beheer/actions";
import { useAdminHint } from "@/components/admin/use-admin-hint";

/**
 * Footer sign-in entry / signed-in state (admin-presence spec).
 *
 * The static markup (and the first client render) shows the discreet "Beheer"
 * sign-in link, so cached pages are identical for everyone. When the client
 * detects the admin hint after hydration, it swaps in the signed-in cluster.
 */
export function FooterAdminLinks() {
  const isAdmin = useAdminHint();

  if (!isAdmin) {
    return (
      <Link href="/beheer/login" className="underline-offset-4 hover:underline">
        Beheer
      </Link>
    );
  }

  // A fragment, not a wrapping <span>: the footer hosts this inside a flex
  // <div>, and a <form> is not valid phrasing content inside a <span> (it would
  // trigger a hydration mismatch). The children join the parent's flex/gap.
  return (
    <>
      <span>Ingelogd als beheerder</span>
      <Link href="/beheer" className="underline-offset-4 hover:underline">
        Overzicht
      </Link>
      <form action={logout} className="flex">
        <button
          type="submit"
          className="text-brand-strong underline-offset-4 hover:underline"
        >
          Uitloggen
        </button>
      </form>
    </>
  );
}
