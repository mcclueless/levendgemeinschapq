"use client";

import { useEffect, useState } from "react";
import { useAdminHint } from "@/components/admin/use-admin-hint";
import { Notice } from "@/components/ui/notice";

/**
 * Confirmation shown on a public listing after a banner hide/delete
 * (admin-presence spec). The action redirects here with `?beheer=verborgen` or
 * `?beheer=verwijderd`; this reads that flag on the client (so the listing
 * stays cache-friendly), shows the confirmation once, and strips the flag from
 * the URL so a reload or Back-navigation doesn't re-show a stale message.
 */
const MESSAGES: Record<string, string> = {
  verborgen: "Verborgen van de website.",
  verwijderd: "Definitief verwijderd.",
};

export function AdminListingNotice() {
  const isAdmin = useAdminHint();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("beheer");
    if (flag && MESSAGES[flag]) {
      setMessage(MESSAGES[flag]);
      // Strip the flag so the confirmation is shown once, not on every reload.
      url.searchParams.delete("beheer");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, []);

  if (!isAdmin || !message) return null;

  return <Notice className="mb-8">{message}</Notice>;
}
