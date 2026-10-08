/**
 * What an upload may be (add-public-media-and-socials D7; image-guidance D2).
 * Dependency-free, so the upload validation in `media.ts` and the guidance text
 * shown beside image fields read the same rules and cannot drift apart.
 */

/** Uploadable formats, as shown to people. SVG is deliberately absent: see `media.ts`. */
export const UPLOAD_FORMATS = ["JPG", "PNG", "GIF", "WebP", "AVIF"] as const;

/**
 * Extensions that may be *uploaded*. Narrower than the extensions the library
 * lists by one entry: SVG is a scriptable document served from the site's own
 * origin, so accepting one is a stored-XSS vector.
 */
export const UPLOAD_EXT = /\.(png|jpe?g|gif|webp|avif)$/i;

/** Maximum accepted upload, both paths. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** The maximum as people read it: "10 MB". */
export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_BYTES / (1024 * 1024)} MB`;
