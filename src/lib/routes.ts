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
  projects: "/projecten",
  project: (slug: string) => `/projecten/${slug}`,
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
  projecten: "project",
} as const;

export type AdminSegment = keyof typeof ADMIN_SEGMENT_TO_TYPE;

export const ADMIN_TYPE_TO_SEGMENT = {
  event: "evenementen",
  venue: "locaties",
  organiser: "organisatoren",
  blog: "blogposts",
  project: "projecten",
} as const;

/** Backend list path for a content type, e.g. "/beheer/evenementen". */
export const adminListPath = (type: keyof typeof ADMIN_TYPE_TO_SEGMENT) =>
  `/beheer/${ADMIN_TYPE_TO_SEGMENT[type]}`;

/** Backend edit-form path for one item, e.g. "/beheer/evenementen/feest/bewerken". */
export const adminEditPath = (
  type: keyof typeof ADMIN_TYPE_TO_SEGMENT,
  slug: string,
) => `${adminListPath(type)}/${slug}/bewerken`;

/**
 * Public listing path for a content type — where to land after hide/delete.
 * Typed as a total Record over the content types, so adding a new type to
 * ADMIN_TYPE_TO_SEGMENT without a path here is a compile error, not a runtime
 * `undefined` redirect.
 */
const PUBLIC_LIST_PATH: Record<keyof typeof ADMIN_TYPE_TO_SEGMENT, string> = {
  event: routes.agenda,
  venue: routes.venues,
  organiser: routes.organisers,
  blog: routes.blog,
  project: routes.projects,
};

export const publicListPath = (type: keyof typeof ADMIN_TYPE_TO_SEGMENT) =>
  PUBLIC_LIST_PATH[type];
