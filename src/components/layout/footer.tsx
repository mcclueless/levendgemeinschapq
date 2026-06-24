import Link from "next/link";
import { Container } from "@/components/ui/container";
import { footerNav, site } from "@/lib/site";
import { FooterAdminLinks } from "./footer-admin-links";

/**
 * Site-wide footer: table of contents / navigation, privacy statement link,
 * and required static content (accessibility-compliance spec).
 */
export function Footer() {
  const year = "2026"; // build-stamped; avoids per-request Date in components

  return (
    <footer className="mt-20 border-t border-border bg-sand">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg font-semibold text-ink">
              {site.name}
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted">{site.description}</p>
          </div>

          <nav
            aria-label="Footernavigatie"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3"
          >
            {footerNav.map((col) => (
              <div key={col.title}>
                <h2 className="font-display text-sm font-semibold tracking-wide text-ink uppercase">
                  {col.title}
                </h2>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. Met zorg gemaakt voor de buurt.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="underline-offset-4 hover:underline">
              Privacyverklaring
            </Link>
            <span aria-hidden>·</span>
            <FooterAdminLinks />
          </div>
        </div>
      </Container>
    </footer>
  );
}
