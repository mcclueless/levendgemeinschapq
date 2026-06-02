import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Crawler directives (seo-discoverability spec). Public content is indexable;
 * the editorial backend and API routes are disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/beheer", "/api"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
