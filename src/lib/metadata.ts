import type { Metadata } from "next";

/**
 * Helper for per-page metadata with a canonical URL (seo-discoverability spec).
 * `metadataBase` is set in the root layout, so `canonical` can be a path.
 */

/**
 * The conventional large-card ratio (share-event-previews D5). Clients use the
 * declared dimensions to choose between a large preview card and a small side
 * thumbnail; without them the choice is left to the client's own guess.
 *
 * Uploads are not processed, so real dimensions are not known at build time.
 * These values therefore state the intended presentation ratio rather than
 * measuring the file — a hint, not a contract. A file whose real ratio differs
 * degrades to the client's own layout choice rather than breaking the card.
 */
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

export function pageMetadata({
  title,
  description,
  path,
  images,
  type = "website",
  shareTitle,
  shareDescription,
}: {
  title: string;
  description?: string;
  path: string;
  images?: string[];
  type?: "website" | "article";
  /**
   * Social-sharing title and description, when a share card should read
   * differently from the page itself. An event's card carries its venue and its
   * date, which belong on the card but would only clutter a browser tab. Both
   * fall back to the page's own title and description.
   */
  shareTitle?: string;
  shareDescription?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: shareTitle ?? title,
      description: shareDescription ?? description,
      type,
      url: path,
      images: images?.map((url) => ({
        url,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
      })),
    },
  };
}
