/** Canonical URL paths for each content type. Keep route strings in one place. */
export const routes = {
  agenda: "/agenda",
  event: (slug: string) => `/agenda/${slug}`,
  venues: "/locaties",
  venue: (slug: string) => `/locaties/${slug}`,
  organisers: "/organisatoren",
  organiser: (slug: string) => `/organisatoren/${slug}`,
  blog: "/blog",
  post: (slug: string) => `/blog/${slug}`,
} as const;

/**
 * Backend management URL segments ↔ content types. The list lives at
 * `/beheer/<segment>` and the edit form at `/beheer/<segment>/<slug>/bewerken`.
 * Plural segments avoid colliding with the static `/beheer/{nieuw,queue,…}` routes.
 */
export const ADMIN_SEGMENT_TO_TYPE = {
  evenementen: "event",
  locaties: "venue",
  organisatoren: "organiser",
  blogposts: "blog",
} as const;

export type AdminSegment = keyof typeof ADMIN_SEGMENT_TO_TYPE;

export const ADMIN_TYPE_TO_SEGMENT = {
  event: "evenementen",
  venue: "locaties",
  organiser: "organisatoren",
  blog: "blogposts",
} as const;

/** Backend list path for a content type, e.g. "/beheer/evenementen". */
export const adminListPath = (type: keyof typeof ADMIN_TYPE_TO_SEGMENT) =>
  `/beheer/${ADMIN_TYPE_TO_SEGMENT[type]}`;
