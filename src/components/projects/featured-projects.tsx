import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProjects } from "@/content/repository";
import { routes } from "@/lib/routes";
import { ProjectGrid } from "./project-card";

/**
 * Reusable, self-resolving featured-projects section (projects spec). Mirrors
 * UpcomingEvents: shows the newest projects with an optional cap and a
 * "see more" affordance when more exist. Dropped onto the homepage below the
 * upcoming-events section.
 */
export async function FeaturedProjects({
  title = "Projecten in de buurt",
  subtitle,
  limit = 6,
  moreHref = routes.projects,
  emptyLabel,
}: {
  title?: string;
  subtitle?: string;
  limit?: number;
  moreHref?: string;
  emptyLabel?: string;
}) {
  const all = await getProjects();
  const projects = all.slice(0, limit);
  const showMore = all.length > projects.length;

  return (
    <section>
      <SectionHeading
        title={title}
        subtitle={subtitle}
        moreHref={showMore ? moreHref : undefined}
      />

      <ProjectGrid projects={projects} emptyLabel={emptyLabel} />

      {showMore ? (
        <div className="mt-6">
          <ButtonLink href={moreHref} variant="secondary">
            Meer projecten bekijken
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
