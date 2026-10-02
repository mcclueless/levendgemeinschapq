"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ADMIN_SEGMENT_TO_TYPE } from "@/lib/routes";
import { LoadingPlaceholder } from "./loading-placeholder";

/** Whether `pathname` is a management list, which loads as a table. */
const isList = (pathname: string) =>
  Object.keys(ADMIN_SEGMENT_TO_TYPE).some((segment) => pathname === `/beheer/${segment}`);

/**
 * Reports every change of address. Renders nothing, and sits in its own
 * `Suspense`: `useSearchParams()` makes the server send whatever its boundary
 * wraps a second time, as a fallback — wrapped around the page itself, every
 * backend page doubled in size.
 */
function AddressWatcher({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(onChange, [pathname, search, onChange]);
  return null;
}

/**
 * The backend's content area, showing a placeholder from the moment a link to
 * another backend page is followed until that page is shown
 * (admin-content-table D8). The navigation around it is not touched.
 *
 * Deliberately not a `loading.tsx`: that streams the page behind a fallback
 * which only JavaScript swaps out, so with scripts off every backend page would
 * stay on the placeholder. Here the server always sends the whole page, and the
 * placeholder is something JavaScript adds while it navigates.
 */
export function PendingContent({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<"page" | "table" | null>(null);

  // The address changed: the page that was loading is here.
  const [arrived] = useState(() => () => setPending(null));

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Only a plain click on a link that navigates this tab within the site.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/beheer")) return;
      // A link to where we already are changes no address, so nothing would
      // ever clear the placeholder.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setPending(isList(url.pathname) ? "table" : "page");
    };
    // The whole backend, sidebar included, is inside this component's parent.
    const root = ref.current?.closest("[data-backend]") ?? document;
    root.addEventListener("click", onClick as EventListener);
    return () => root.removeEventListener("click", onClick as EventListener);
  }, []);

  return (
    <div ref={ref}>
      <Suspense fallback={null}>
        <AddressWatcher onChange={arrived} />
      </Suspense>
      {pending ? <LoadingPlaceholder shape={pending} /> : null}
      <div hidden={pending !== null}>{children}</div>
    </div>
  );
}
