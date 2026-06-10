/** Default cover shown for events without an uploaded featured image. */
export const DEFAULT_EVENT_IMAGE = "/event-placeholder.svg";

/** An event's cover image, falling back to the branded default. */
export const eventCover = (featuredImage?: string): string =>
  featuredImage || DEFAULT_EVENT_IMAGE;
