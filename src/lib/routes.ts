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
