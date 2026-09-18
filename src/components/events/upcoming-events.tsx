import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getUpcomingEvents } from "@/content/events";
import { routes } from "@/lib/routes";
import { EventList, type EventListVariant } from "./event-list";
import { LoadMore, ViewSwitch, type SwitchableListing } from "./listing-controls";
import { LISTING_ANCHOR } from "@/lib/listing-view";

/**
 * Reusable, embeddable upcoming-events listing (events spec). Resolves its own
 * data, so it can be dropped onto static pages, blog posts (via MDX), and the
 * bottom of venue/organiser pages. Shows today + future, soonest first, with an
 * optional limit and a "See more…" affordance when more exist.
 *
 * With `switchable` (homepage), it also offers the cards ↔ table switch and
 * "Meer laden"; the view and count then come from the URL and override `variant`
 * and `limit` (event-list-table-view D7). Venue and organiser pages don't pass it.
 */
export async function UpcomingEvents({
  title,
  subtitle,
  limit = 6,
  venueSlug,
  organiserSlug,
  variant = "image",
  moreHref = routes.agenda,
  showSeeMore = true,
  emptyLabel,
  horizonDays,
  switchable,
}: {
  title?: string;
  subtitle?: string;
  limit?: number;
  venueSlug?: string;
  organiserSlug?: string;
  variant?: EventListVariant;
  moreHref?: string;
  showSeeMore?: boolean;
  emptyLabel?: string;
  horizonDays?: number;
  switchable?: SwitchableListing;
}) {
  const { occurrences, hasMore, total } = await getUpcomingEvents({
    limit: switchable ? switchable.state.count : limit,
    venueSlug,
    organiserSlug,
    horizonDays,
  });
  const listVariant: EventListVariant = switchable
    ? switchable.state.view === "tabel"
      ? "table"
      : "image"
    : variant;

  const showMore = showSeeMore && hasMore;

  return (
    <section id={switchable ? LISTING_ANCHOR : undefined} className="scroll-mt-24">
      {title ? (
        <SectionHeading
          title={title}
          subtitle={subtitle}
          moreHref={showMore ? moreHref : undefined}
        />
      ) : null}

      {switchable && total > 0 ? (
        <div className="mb-5">
          <ViewSwitch listing={switchable} />
        </div>
      ) : null}

      <EventList
        occurrences={occurrences}
        variant={listVariant}
        emptyLabel={emptyLabel}
      />

      {switchable ? (
        <LoadMore listing={switchable} shown={occurrences.length} total={total} />
      ) : null}

      {showMore ? (
        <div className="mt-6">
          <ButtonLink href={moreHref} variant="secondary">
            Meer evenementen bekijken
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
