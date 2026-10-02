"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Backend navigation entries (admin-content-table D7), in three groups: the
 * dashboard, the content types, and the tools. `also` names the addresses
 * outside an entry's own path that belong to its section — a type's create
 * form lives under `/beheer/nieuw/`, and import is part of the feeds.
 */
const groups: Array<Array<{ href: string; label: string; also?: string[] }>> = [
  [{ href: "/beheer", label: "Overzicht" }],
  [
    { href: "/beheer/evenementen", label: "Evenementen", also: ["/beheer/nieuw/evenement"] },
    { href: "/beheer/locaties", label: "Locaties", also: ["/beheer/nieuw/locatie"] },
    { href: "/beheer/organisatoren", label: "Organisatoren", also: ["/beheer/nieuw/organisator"] },
    { href: "/beheer/blogposts", label: "Blogposts", also: ["/beheer/nieuw/blog"] },
    { href: "/beheer/projecten", label: "Projecten", also: ["/beheer/nieuw/project"] },
  ],
  [
    { href: "/beheer/queue", label: "Wachtrij" },
    { href: "/beheer/galerij", label: "Galerij" },
    { href: "/beheer/feeds", label: "Agenda-feeds", also: ["/beheer/import"] },
  ],
];

const within = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * The navigation list, marking the section the current page belongs to. The
 * mark is `aria-current` for assistive technology, and a bar plus heavier text
 * for the eye — not colour alone (accessibility-compliance spec).
 */
export function AdminNav({ label }: { label: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label}>
      {groups.map((group, i) => (
        <ul
          key={i}
          className={cn("grid gap-0.5", i > 0 && "mt-3 border-t border-admin-border pt-3")}
        >
          {group.map((item) => {
            const current =
              item.href === "/beheer"
                ? pathname === "/beheer"
                : [item.href, ...(item.also ?? [])].some((href) => within(pathname, href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "block rounded-sm border-l-4 px-3 py-2 text-sm hover:bg-white/10 hover:text-admin-fg",
                    current
                      ? "border-admin-accent bg-white/10 font-semibold text-admin-fg"
                      : "border-transparent font-medium text-admin-fg/75",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ))}
    </nav>
  );
}
