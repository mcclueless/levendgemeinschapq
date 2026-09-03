import type { MetadataRoute } from "next";
import {
  getAllEvents,
  getBlogPosts,
  getOrganisers,
  getProjects,
  getVenues,
} from "@/content/repository";
import { routes } from "@/lib/routes";
import { absolute } from "@/lib/structured-data";

/**
 * Rendered per request (fix-stale-recurring-event-dates D5). Anything prerendered
 * at build time describes the committed `content/` seed, not production: the
 * store reads the seed during `next build` and S3 at runtime, and the
 * regeneration that was supposed to reconcile the two never persists on this
 * deployment. Prerendering therefore froze seed data permanently.
 */
export const dynamic = "force-dynamic";

/** XML sitemap of all public content (seo-discoverability spec). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, venues, organisers, posts, projects] = await Promise.all([
    getAllEvents(),
    getVenues(),
    getOrganisers(),
    getBlogPosts(),
    getProjects(),
  ]);

  const staticPaths = [
    "/",
    routes.agenda,
    routes.projects,
    routes.venues,
    routes.organisers,
    routes.blog,
    "/over",
    "/privacy",
    "/cookies",
    "/toegankelijkheid",
  ].map((path) => ({ url: absolute(path), changeFrequency: "weekly" as const }));

  const content = [
    ...events.map((e) => e.href),
    ...venues.map((v) => v.href),
    ...organisers.map((o) => o.href),
    ...posts.map((p) => p.href),
    ...projects.map((p) => p.href),
  ].map((href) => ({ url: absolute(href), changeFrequency: "weekly" as const }));

  return [...staticPaths, ...content];
}
