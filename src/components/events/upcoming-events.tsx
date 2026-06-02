import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getUpcomingEvents } from "@/content/events";
import { routes } from "@/lib/routes";
import { EventList, type EventListVariant } from "./event-list";

/**
 * Reusable, embeddable upcoming-events listing (events spec). Resolves its own
 * data, so it can be dropped onto static pages, blog posts (via MDX), and the
 * bottom of venue/organiser pages. Shows today + future, soonest first, with an
 * optional limit and a "See more…" affordance when more exist.
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
}) {
  const { occurrences, hasMore } = await getUpcomingEvents({
    limit,
    venueSlug,
    organiserSlug,
  });

  const showMore = showSeeMore && hasMore;

  return (
    <section>
      {title ? (
        <SectionHeading
          title={title}
          subtitle={subtitle}
          moreHref={showMore ? moreHref : undefined}
        />
      ) : null}

      <EventList
        occurrences={occurrences}
        variant={variant}
        emptyLabel={emptyLabel}
      />

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
