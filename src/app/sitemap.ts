import type { MetadataRoute } from "next";
import {
  getAllEvents,
  getBlogPosts,
  getOrganisers,
  getVenues,
} from "@/content/repository";
import { routes } from "@/lib/routes";
import { absolute } from "@/lib/structured-data";

/** XML sitemap of all public content (seo-discoverability spec). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, venues, organisers, posts] = await Promise.all([
    getAllEvents(),
    getVenues(),
    getOrganisers(),
    getBlogPosts(),
  ]);

  const staticPaths = [
    "/",
    routes.agenda,
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
  ].map((href) => ({ url: absolute(href), changeFrequency: "weekly" as const }));

  return [...staticPaths, ...content];
}
