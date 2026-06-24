"use client";

import { useEffect, useState } from "react";
import { ADMIN_HINT_COOKIE } from "@/lib/auth-constants";

/**
 * Client-only read of the `lg_admin` hint cookie (admin-presence spec).
 *
 * Returns `false` during SSR and the first client render so that static markup
 * stays identical for everyone; flips to `true` after mount when the hint is
 * present. The hint is NOT proof of authorization — privileged actions remain
 * gated server-side — so a stale hint at worst reveals UI that fails safe.
 */
export function useAdminHint(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const present = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${ADMIN_HINT_COOKIE}=`));
    setIsAdmin(present);
  }, []);

  return isAdmin;
}
