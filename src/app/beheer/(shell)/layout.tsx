import { AdminShell } from "@/components/admin/admin-shell";

/**
 * The backend's shared chrome (admin-content-table D1). A route group, so no
 * address changes; the login page sits outside it and gets no navigation.
 *
 * A layout is not re-run on navigation, so it checks nothing: every page keeps
 * its own `requireAdmin()`, and the middleware guards `/beheer/*`.
 */
export default function BackendLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
