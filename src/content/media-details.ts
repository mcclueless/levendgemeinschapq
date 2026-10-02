import { cache } from "react";
import matter from "gray-matter";
import { z } from "zod";
import { getStore } from "./storage";
import { mediaName } from "@/lib/media-name";

export { mediaName };

/**
 * What an editor has said about an image (gallery-find-and-describe D7): a
 * title to show in place of the file name, and an alternative text.
 *
 * Like a feed, this is **not content**: it has no page and no publication
 * status, so it is not a `ContentType`. It lives beside the content in the
 * content store, under its own prefix, one small document per image:
 * `media/<file name>.mdx`. The media bucket itself is public, so nothing an
 * editor writes about an image is stored there.
 *
 * An image without a document has no details and behaves as it always did.
 */

export const MEDIA_DETAILS_PREFIX = "media";

export const MediaDetails = z.object({
  title: z.string().trim().min(1).optional(),
  alt: z.string().trim().min(1).optional(),
});
export type MediaDetails = z.infer<typeof MediaDetails>;

/** Whether an address is an uploaded image, the only kind that can have details. */
const isUpload = (url: string) => /(^|\/)uploads\/[^/]+$/.test(url.split(/[?#]/)[0]);

const keyFor = (name: string) => `${MEDIA_DETAILS_PREFIX}/${name}.mdx`;

/**
 * The stored form of an image's details, or `null` when there is nothing to
 * store — saving empty details removes the document rather than leaving an
 * empty one behind. Pure, so the rule is testable without a store.
 */
export function detailsDocument(details: { title?: string; alt?: string }): string | null {
  const clean = Object.fromEntries(
    Object.entries({ title: details.title?.trim(), alt: details.alt?.trim() }).filter(
      ([, v]) => v !== undefined && v !== "",
    ),
  );
  return Object.keys(clean).length > 0 ? matter.stringify("\n", clean) : null;
}

/** The details in a stored document, or `null` when it is not a valid one. */
export function readDetailsDocument(raw: string): MediaDetails | null {
  const parsed = MediaDetails.safeParse(matter(raw).data);
  return parsed.success ? parsed.data : null;
}

/**
 * The details of every described image, by file name — for the backend, which
 * shows titles across the gallery and the picker. An invalid document is
 * skipped, as an invalid feed is.
 */
export const loadMediaDetails = cache(async (): Promise<Map<string, MediaDetails>> => {
  const docs = await getStore().readPrefix(MEDIA_DETAILS_PREFIX);
  const out = new Map<string, MediaDetails>();
  for (const doc of docs) {
    const details = readDetailsDocument(doc.raw);
    if (!details) {
      console.error(`[media] skipped invalid image details: ${doc.key}`);
      continue;
    }
    out.set(doc.slug, details);
  }
  return out;
});

/**
 * One image's details, by its address — for public pages, which need only the
 * images they show: one read per image and no listing (D9).
 */
export const getMediaDetails = cache(async (url: string): Promise<MediaDetails | null> => {
  if (!isUpload(url)) return null;
  const raw = await getStore().read(keyFor(mediaName(url)));
  return raw == null ? null : readDetailsDocument(raw);
});

/**
 * The text alternative for an image where a page shows it: the image's own
 * when it has one, else what the page would have said (D9).
 */
export async function imageAlt(url: string | undefined, fallback: string): Promise<string> {
  if (!url) return fallback;
  return (await getMediaDetails(url))?.alt ?? fallback;
}

/** Store an image's details; empty details remove the document. */
export async function saveMediaDetails(
  name: string,
  details: { title?: string; alt?: string },
): Promise<void> {
  const doc = detailsDocument(details);
  if (doc == null) await getStore().remove(keyFor(name));
  else await getStore().write(keyFor(name), doc);
}

/** Remove an image's details, when the image itself is deleted. */
export async function removeMediaDetails(name: string): Promise<void> {
  await getStore().remove(keyFor(name));
}
