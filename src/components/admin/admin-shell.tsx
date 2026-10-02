import { Container } from "@/components/ui/container";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { logout } from "@/app/beheer/actions";
import { Suspense } from "react";
import { AdminNav } from "./admin-nav";
import { PendingContent } from "./pending-content";

function LogoutButton() {
  return (
    <form action={logout} className="mt-3 border-t border-admin-border pt-3">
      <button
        type="submit"
        className="w-full rounded-sm border-l-4 border-transparent px-3 py-2 text-left text-sm font-medium text-admin-danger hover:bg-white/10"
      >
        Uitloggen
      </button>
    </form>
  );
}

/**
 * Chrome for authenticated backend pages (editorial-backend spec), rendered
 * once by the backend layout so it stays in place between pages
 * (admin-content-table D1).
 *
 * The shared dark "ink" admin chrome — the same treatment as the public admin
 * banner, so dark chrome always reads as management mode (design-system spec).
 * A sidebar on wide screens; below that a bar whose menu control reveals the
 * same entries, following the public header's control (D7).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-backend className="lg:flex lg:items-start">
      <div className="admin-chrome border-b border-admin-border lg:hidden">
        <Container className="flex h-14 items-center justify-between gap-4">
          <span className="font-display font-semibold text-admin-fg">Beheer</span>
          <MobileMenu
            label="Beheermenu"
            className="lg:hidden"
            summaryClassName="border border-admin-border text-admin-fg hover:bg-white/10"
            panelClassName="admin-chrome border border-admin-border"
          >
            <AdminNav label="Beheernavigatie (mobiel)" />
            <LogoutButton />
          </MobileMenu>
        </Container>
      </div>

      {/* Sticks under the public header (h-16), and scrolls on its own if the
          window is shorter than the list. */}
      <aside className="admin-chrome sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-admin-border p-3 lg:block">
        <p className="px-3 pb-3 pt-2 font-display font-semibold text-admin-fg">Beheer</p>
        <AdminNav label="Beheernavigatie" />
        <LogoutButton />
      </aside>

      <div className="min-w-0 flex-1">
        <Container className="py-10">
          {/* Reads the search parameters, which suspends where a page is
              rendered ahead of time; until then the page shows as it is. */}
          <Suspense fallback={children}>
            <PendingContent>{children}</PendingContent>
          </Suspense>
        </Container>
      </div>
    </div>
  );
}
