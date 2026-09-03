import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Mdx } from "@/components/mdx/mdx";
import { CoverImage } from "@/components/content/cover-image";
import { getProject } from "@/content/repository";
import { pageMetadata } from "@/lib/metadata";
import { AdminBarMount } from "@/components/admin/admin-bar-mount";
import { adminEditPath } from "@/lib/routes";

/**
 * Rendered per request (fix-stale-recurring-event-dates D5). Anything prerendered
 * at build time describes the committed `content/` seed, not production: the
 * store reads the seed during `next build` and S3 at runtime, and the
 * regeneration that was supposed to reconcile the two never persists on this
 * deployment. Prerendering therefore froze seed data permanently.
 */
export const dynamic = "force-dynamic";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return pageMetadata({
    title: project.title,
    description: project.excerpt,
    path: project.href,
    type: "article",
    images: project.featuredImage ? [project.featuredImage] : undefined,
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <>
      <AdminBarMount
        type="project"
        slug={project.slug}
        title={project.title}
        editHref={adminEditPath("project", project.slug)}
      />
      <Container className="py-14">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-4xl sm:text-5xl">{project.title}</h1>
          <CoverImage
            src={project.featuredImage}
            alt={project.title}
            className="mt-8 aspect-[2/1] rounded-xl"
          />
          <div className="mt-8">
            <Mdx source={project.body} />
          </div>

          {/* Location + organisers (projects spec): one venue, many organisers.
              Unknown references are already dropped by the resolver. */}
          {project.venue || project.organisers.length > 0 ? (
            <dl className="mt-10 grid gap-4 border-t border-border pt-6 text-muted sm:grid-cols-2">
              {project.venue ? (
                <div>
                  <dt className="text-sm font-medium text-ink">Locatie</dt>
                  <dd className="mt-1">
                    <Link
                      href={project.venue.href}
                      className="font-medium text-brand-strong hover:underline"
                    >
                      📍 {project.venue.name}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {project.organisers.length > 0 ? (
                <div>
                  <dt className="text-sm font-medium text-ink">Door</dt>
                  <dd className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                    {project.organisers.map((o, i) => (
                      <span key={o.slug}>
                        <Link
                          href={o.href}
                          className="font-medium text-brand-strong hover:underline"
                        >
                          {o.name}
                        </Link>
                        {i < project.organisers.length - 1 ? " ·" : null}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </article>
      </Container>
    </>
  );
}
