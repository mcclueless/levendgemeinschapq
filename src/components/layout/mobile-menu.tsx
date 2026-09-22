"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Small-screen primary navigation (mobile-navigation-menu D1).
 *
 * A native `<details>` disclosure, so it opens and closes with no JavaScript at
 * all — the header's navigation is `hidden md:block`, and a button that needed
 * JavaScript would leave a phone visitor with no navigation whenever it fails.
 * The element also gives us Enter/Space activation and the open/closed
 * behaviour for free.
 *
 * JavaScript only adds what the native element lacks: Escape, outside clicks,
 * closing on navigation, and an explicit expanded state. The header sits in the
 * root layout and is never re-mounted, so an open menu would otherwise stay open
 * over the page a visitor just opened.
 *
 * The summary carries `role="button"` and `aria-expanded` rather than relying on
 * the element's implicit semantics: measured in Chrome, the bare `<summary>` was
 * exposed as an unnamed group with no expanded state, so a screen reader would
 * not announce the control or whether it is open. `aria-expanded` is kept in
 * sync from the element's own `toggle` event, so it stays right however the
 * disclosure was operated.
 */
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  // Close after a navigation. A link to the current page changes no path, so
  // clicks inside the panel close it too (see the onClick below).
  useEffect(close, [pathname]);

  // Bound to the element rather than via React's onToggle: `toggle` does not
  // bubble, and the state must follow however the disclosure was operated.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onToggle = () => setOpen(el.open);
    onToggle();
    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !ref.current?.open) return;
      close();
      // Never drop a keyboard visitor onto the page body.
      ref.current.querySelector("summary")?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <details ref={ref} className="relative md:hidden">
      <summary
        role="button"
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-surface text-ink transition-colors hover:bg-surface-2 focus-visible:outline-3 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </summary>
      {/* Anchored to the header's right edge, under the sticky bar. */}
      <div
        onClick={close}
        className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-border bg-surface p-2 shadow-lg"
      >
        {children}
      </div>
    </details>
  );
}
