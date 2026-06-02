import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";
import { ContactInfo } from "./contact-info";
import type { Organiser, Venue } from "@/content/types";

/**
 * Info block appended to a blog post (editorial: attach venue/organiser info).
 * Shows the linked Venues and Organisers with their contact details.
 */
export function RelatedInfo({
  venues,
  organisers,
}: {
  venues: Venue[];
  organisers: Organiser[];
}) {
  if (venues.length === 0 && organisers.length === 0) return null;

  return (
    <aside className="mt-12 border-t border-border pt-8">
      <h2 className="text-2xl">Meer informatie</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {venues.map((v) => (
          <Card key={`v-${v.slug}`} as="section" className="p-5">
            <Badge tone="terracotta">Locatie</Badge>
            <h3 className="mt-2 text-lg">
              <Link href={v.href} className="hover:text-terracotta-strong">
                {v.name}
              </Link>
            </h3>
            {v.excerpt ? (
              <p className="mt-1 text-sm text-muted">{v.excerpt}</p>
            ) : null}
            <div className="mt-3">
              <ContactInfo
                phone={v.phone}
                email={v.email}
                website={v.website}
                address={v.address}
              />
            </div>
          </Card>
        ))}

        {organisers.map((o) => (
          <Card key={`o-${o.slug}`} as="section" className="p-5">
            <Badge tone="forest">Organisator</Badge>
            <h3 className="mt-2 text-lg">
              <Link href={o.href} className="hover:text-terracotta-strong">
                {o.name}
              </Link>
            </h3>
            {o.excerpt ? (
              <p className="mt-1 text-sm text-muted">{o.excerpt}</p>
            ) : null}
            <div className="mt-3">
              <ContactInfo phone={o.phone} email={o.email} website={o.website} />
            </div>
          </Card>
        ))}
      </div>
    </aside>
  );
}
