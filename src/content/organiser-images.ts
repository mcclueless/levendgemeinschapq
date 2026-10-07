/**
 * An organiser's images, stored as `featuredImage` + `moreImages` and used as
 * one ordered list (organiser-page-layout D1, D2). `featuredImage` keeps its
 * shape and meaning as the cover everywhere else, so files from before the
 * list stay valid and a rollback hides nothing.
 *
 * Pure, so the read and write rules are testable without the store.
 */

/** The stored image fields of an organiser. */
export interface StoredOrganiserImages {
  featuredImage?: string;
  moreImages?: string[];
}

/** Every image of an organiser in order, cover first, without duplicates. */
export function organiserImages(data: StoredOrganiserImages): string[] {
  return [...new Set([data.featuredImage, ...(data.moreImages ?? [])])].filter(
    (url): url is string => Boolean(url),
  );
}

/**
 * The stored fields for the image list posted by the organiser form: the first
 * as the cover, the rest as further images. Both keys are always present so
 * that the merge on save clears what the editor removed; `undefined` values
 * are not written.
 */
export function organiserImageFields(urls: readonly string[]): {
  featuredImage: string | undefined;
  moreImages: string[] | undefined;
} {
  const [first, ...rest] = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
  return { featuredImage: first, moreImages: rest.length > 0 ? rest : undefined };
}

/**
 * The images an organiser uses besides its cover — further slides and the
 * logo — which the gallery must treat as in use (organiser-page-layout D6).
 */
export function organiserGallery(data: StoredOrganiserImages & { logo?: string }): string[] {
  return [...(data.moreImages ?? []), data.logo].filter((url): url is string => Boolean(url));
}

/** What an organiser card shows in its image area (organiser-card-logo D1). */
export type OrganiserCardImage =
  | { kind: "logo"; src: string }
  | { kind: "cover"; src: string }
  | { kind: "name" };

/**
 * The image for an organiser card, wherever organisers are listed: the logo
 * when there is one, else the cover, else the name on a panel. One rule for
 * the overview and the homepage, so the same organiser looks the same on both.
 */
export function organiserCardImage(
  data: StoredOrganiserImages & { logo?: string },
): OrganiserCardImage {
  if (data.logo?.trim()) return { kind: "logo", src: data.logo };
  if (data.featuredImage?.trim()) return { kind: "cover", src: data.featuredImage };
  return { kind: "name" };
}
