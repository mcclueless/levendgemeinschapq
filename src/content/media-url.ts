/**
 * An image address that changes whenever the file does (gallery-find-and-describe
 * D10, revised 2026-10-09). Replacing an image keeps its stored address, so every
 * page that uses it shows the new file. But a browser that already holds the
 * image for that address in memory, as the backend does after the replace
 * returns to the gallery without a full page load, keeps showing the old
 * picture until a reload. Adding the file's last-modified time gives the
 * backend's views an address of their own per version.
 *
 * For display in the backend only. The stored address, the one content refers
 * to and the one a picker hands back, stays the plain `url`.
 */
export function versionedImageUrl(item: { url: string; lastModified?: string }): string {
  const time = item.lastModified ? Date.parse(item.lastModified) : NaN;
  if (!Number.isFinite(time)) return item.url;
  return `${item.url}${item.url.includes("?") ? "&" : "?"}v=${time}`;
}
