"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { mainNav } from "@/lib/site";

/**
 * Primary nav links with an accessible active state (aria-current). The same
 * entries serve the header bar and the small-screen menu, so `mainNav` stays the
 * one source of truth (mobile-navigation-menu D2).
 */
export function NavLinks({
  orientation = "horizontal",
}: {
  orientation?: "horizontal" | "vertical";
}) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <ul className={cn("flex gap-1", vertical ? "flex-col" : "items-center")}>
      {mainNav.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-sm px-3 py-2 text-[0.975rem] font-medium transition-colors hover:bg-surface-2 hover:text-ink",
                active ? "bg-surface-2 text-ink" : "text-muted",
                vertical && "block",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
