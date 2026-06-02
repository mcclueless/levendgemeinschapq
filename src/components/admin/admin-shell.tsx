import Link from "next/link";
import { Container } from "@/components/ui/container";
import { logout } from "@/app/beheer/actions";

const adminNav = [
  { href: "/beheer", label: "Overzicht" },
  { href: "/beheer/queue", label: "Wachtrij" },
  { href: "/beheer/import", label: "Importeren" },
];

/** Chrome for authenticated backend pages (editorial-backend spec). */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-border bg-sand">
        <Container className="flex h-14 items-center justify-between gap-4">
          <nav aria-label="Beheernavigatie" className="flex items-center gap-1">
            <span className="mr-2 font-display font-semibold">Beheer</span>
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-1.5 text-sm font-medium text-muted hover:bg-cream hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-sm px-3 py-1.5 text-sm font-medium text-terracotta-strong hover:underline"
            >
              Uitloggen
            </button>
          </form>
        </Container>
      </div>
      <Container className="py-10">{children}</Container>
    </div>
  );
}
