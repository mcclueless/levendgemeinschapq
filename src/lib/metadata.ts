import type { Metadata } from "next";

/**
 * Helper for per-page metadata with a canonical URL (seo-discoverability spec).
 * `metadataBase` is set in the root layout, so `canonical` can be a path.
 */
export function pageMetadata({
  title,
  description,
  path,
  images,
  type = "website",
}: {
  title: string;
  description?: string;
  path: string;
  images?: string[];
  type?: "website" | "article";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type,
      url: path,
      images,
    },
  };
}
