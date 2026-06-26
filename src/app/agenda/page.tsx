import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/card";
import { EventList } from "@/components/events/event-list";
import { getUpcomingEvents } from "@/content/events";
import { AdminListingNotice } from "@/components/admin/admin-listing-notice";

// Rendered per request (dynamic-content-listings): reads S3 live so a
// publish/edit/hide/delete shows on the next request, with no CDN-cache lag.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda",
  description:
    "Alle aankomende evenementen in de buurt — vandaag en in de komende weken.",
};

// Show roughly the next quarter so weekly/monthly recurrences don't flood the
// full listing with a year of repeats (events spec: today + upcoming).
const AGENDA_HORIZON_DAYS = 90;

export default async function AgendaPage() {
  const { occurrences, total } = await getUpcomingEvents({
    horizonDays: AGENDA_HORIZON_DAYS,
  });

  return (
    <Container className="py-14">
      <AdminListingNotice />
      <Badge tone="brand">Agenda</Badge>
      <h1 className="mt-4 text-4xl sm:text-5xl">Aankomende evenementen</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        {total > 0
          ? `${total} ${total === 1 ? "activiteit" : "activiteiten"} om naar uit te kijken.`
          : "Er staan op dit moment geen evenementen gepland. Kom snel terug!"}
      </p>

      <div className="mt-10">
        <EventList occurrences={occurrences} variant="image" />
      </div>
    </Container>
  );
}
