import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { NavLinks } from "./nav-links";
import { site } from "@/lib/site";

/** Site header with brand wordmark and primary navigation. */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-ink"
        >
          {site.name}
        </Link>

        <nav aria-label="Hoofdnavigatie" className="hidden md:block">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/evenement-indienen" size="sm" className="max-sm:hidden">
            Evenement indienen
          </ButtonLink>
          <ButtonLink
            href="/agenda"
            size="sm"
            variant="secondary"
            className="md:hidden"
          >
            Agenda
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
