import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CoverImage } from "@/components/content/cover-image";
import type { Project } from "@/content/types";

/** Project preview card — shared by the overview grid and the homepage section. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card as="article" className="overflow-hidden">
      <CoverImage
        src={project.featuredImage}
        alt={project.title}
        className="h-56"
      />
      <div className="p-6">
        <h3 className="text-2xl">
          <Link href={project.href} className="hover:text-terracotta-strong">
            {project.title}
          </Link>
        </h3>
        {project.venue ? (
          <p className="mt-2 text-sm text-muted">📍 {project.venue.name}</p>
        ) : null}
        {project.organisers.length > 0 ? (
          <p className="mt-1 text-sm text-muted">
            door {project.organisers.map((o) => o.name).join(" · ")}
          </p>
        ) : null}
        {project.excerpt ? (
          <p className="mt-3 text-muted">{project.excerpt}</p>
        ) : null}
        <p className="mt-3">
          <Link
            href={project.href}
            className="text-sm font-medium text-terracotta-strong hover:underline"
          >
            Bekijk project →
          </Link>
        </p>
      </div>
    </Card>
  );
}

/** A responsive grid of project cards with an empty state. */
export function ProjectGrid({
  projects,
  emptyLabel = "Er zijn nog geen projecten.",
}: {
  projects: Project[];
  emptyLabel?: string;
}) {
  if (projects.length === 0) {
    return <p className="text-muted">{emptyLabel}</p>;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </div>
  );
}
