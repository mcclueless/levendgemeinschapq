// Pure and free of store imports on purpose: the image picker runs in the
// browser and needs an image's name too.

/**
 * An image's file name — the last segment of its storage key or its address,
 * e.g. "borrel-8f3a1c.jpg". The details document is named after it, so one
 * follows from the other without a lookup.
 */
export function mediaName(keyOrUrl: string): string {
  const path = keyOrUrl.split(/[?#]/)[0];
  const name = path.slice(path.lastIndexOf("/") + 1);
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}
