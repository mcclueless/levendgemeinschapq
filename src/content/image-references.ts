import type { ContentType } from "./schema";

/**
 * Whether content uses an image (media-library "Reference-safe image deletion",
 * body-editor-toolbar D6). Pure, so the rule is testable without the store.
 */

/** What the check needs to know about one content item. */
export interface ImageUser {
  kind: ContentType;
  slug: string;
  title: string;
  href: string;
  cover?: string;
  gallery?: string[];
  body: string;
}

export interface ImageReference {
  kind: ContentType;
  slug: string;
  title: string;
  href: string;
}

/**
 * The items that use `url`: as their cover, in their gallery, or anywhere in
 * their body text. A plain substring match on the exact URL is enough for the
 * body — stored filenames are unguessable and unique, so the URL only appears
 * in a text that really uses it.
 */
export function imageReferencesIn(url: string, users: readonly ImageUser[]): ImageReference[] {
  return users
    .filter((u) => u.cover === url || u.gallery?.includes(url) || u.body.includes(url))
    .map(({ kind, slug, title, href }) => ({ kind, slug, title, href }));
}

/**
 * The items using each of `urls`, in one pass over the content
 * (gallery-find-and-describe D2). Every URL has an entry; an unused image has
 * an empty list.
 */
export function imageUsage(
  urls: readonly string[],
  users: readonly ImageUser[],
): Map<string, ImageReference[]> {
  return new Map(urls.map((url) => [url, imageReferencesIn(url, users)]));
}
