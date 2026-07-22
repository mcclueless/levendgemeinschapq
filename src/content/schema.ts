import { z } from "zod";

/**
 * Frontmatter schemas for MD/MDX content (design D2).
 * These validate documents at read time; malformed docs are surfaced as errors
 * rather than rendered broken (content-storage spec).
 */

export const ContentType = z.enum([
  "event",
  "venue",
  "organiser",
  "blog",
  "project",
]);
export type ContentType = z.infer<typeof ContentType>;

/** Publication state drives the approval queue (user-roles-approval spec). */
export const PublishStatus = z.enum(["draft", "pending", "published"]);
export type PublishStatus = z.infer<typeof PublishStatus>;

const contact = {
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
};

/** Recurrence rule — v1 supports weekly/monthly with an optional end (design D5). */
export const RecurrenceSchema = z.object({
  freq: z.enum(["weekly", "monthly"]),
  interval: z.number().int().positive().default(1),
  until: z.coerce.date().optional(),
});
export type Recurrence = z.infer<typeof RecurrenceSchema>;

/**
 * Curated social-media profile links (editorial-enrichments). A fixed set of
 * optional URLs — each platform omitted unless a URL is provided. Plain links,
 * not embedded feeds.
 */
export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "x",
  "linkedin",
  "youtube",
] as const;

/**
 * A social profile link. `.url()` alone accepts `javascript:alert(1)`, and the
 * value is rendered straight into an `href`, so the scheme allowlist is what
 * actually closes that hole. Safe to enforce at the schema layer here: no
 * stored content carries socials yet, so nothing existing can be invalidated —
 * unlike `recurrence.until` or an event's `end`, where tightening the schema
 * would make already-stored documents vanish via `parseAll`'s skip.
 * Writers must agree with this: see `socials-form.ts`.
 */
const webUrl = () =>
  z
    .string()
    .url()
    .refine(
      (v) => {
        try {
          const { protocol } = new URL(v);
          return protocol === "http:" || protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "must be an http(s) URL" },
    );

export const SocialsSchema = z
  .object({
    instagram: webUrl().optional(),
    facebook: webUrl().optional(),
    x: webUrl().optional(),
    linkedin: webUrl().optional(),
    youtube: webUrl().optional(),
  })
  .optional();
export type Socials = z.infer<typeof SocialsSchema>;

export const EventFrontmatter = z.object({
  title: z.string().min(1),
  start: z.coerce.date(),
  end: z.coerce.date().optional(),
  /** Slug references resolved against venue/organiser records. */
  venue: z.string().min(1),
  organiser: z.string().min(1),
  featuredImage: z.string().optional(),
  excerpt: z.string().optional(),
  socials: SocialsSchema,
  recurrence: RecurrenceSchema.optional(),
  /** Calendar UID for import de-duplication (calendar-import spec). */
  uid: z.string().optional(),
  status: PublishStatus.default("published"),
  /** Who/how it was submitted, and review metadata (approval queue). */
  submittedBy: z.string().optional(),
  submittedAt: z.coerce.date().optional(),
  reviewNote: z.string().optional(),
});
export type EventFrontmatter = z.infer<typeof EventFrontmatter>;

export const VenueFrontmatter = z.object({
  name: z.string().min(1),
  ...contact,
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  featuredImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  excerpt: z.string().optional(),
  status: PublishStatus.default("published"),
});
export type VenueFrontmatter = z.infer<typeof VenueFrontmatter>;

export const OrganiserFrontmatter = z.object({
  name: z.string().min(1),
  ...contact,
  /** Optional linked Location — a Venue slug (editorial-enrichments). */
  location: z.string().optional(),
  featuredImage: z.string().optional(),
  excerpt: z.string().optional(),
  socials: SocialsSchema,
  status: PublishStatus.default("published"),
});
export type OrganiserFrontmatter = z.infer<typeof OrganiserFrontmatter>;

export const BlogFrontmatter = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  author: z.string().min(1),
  featuredImage: z.string().optional(),
  excerpt: z.string().optional(),
  /** Venue/Organiser slugs shown as an info block at the end of the post. */
  relatedVenues: z.array(z.string()).default([]),
  relatedOrganisers: z.array(z.string()).default([]),
  status: PublishStatus.default("published"),
  submittedBy: z.string().optional(),
  submittedAt: z.coerce.date().optional(),
  reviewNote: z.string().optional(),
});
export type BlogFrontmatter = z.infer<typeof BlogFrontmatter>;

/**
 * Project — a neighbourhood initiative (projects spec). Inherits Location and
 * Organiser *references* (resolved to records at read time): exactly one venue,
 * one or more organisers. `date` is stamped automatically on save and used only
 * for newest-first ordering — it is not an editor-entered field (design D2).
 * Admin-only: no submission/review metadata (design D4).
 */
export const ProjectFrontmatter = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  /** Slug references resolved against venue/organiser records. */
  venue: z.string().min(1),
  organisers: z.array(z.string().min(1)).min(1),
  featuredImage: z.string().optional(),
  excerpt: z.string().optional(),
  status: PublishStatus.default("published"),
});
export type ProjectFrontmatter = z.infer<typeof ProjectFrontmatter>;

export const frontmatterByType = {
  event: EventFrontmatter,
  venue: VenueFrontmatter,
  organiser: OrganiserFrontmatter,
  blog: BlogFrontmatter,
  project: ProjectFrontmatter,
} as const;
