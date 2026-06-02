import { z } from "zod";

/**
 * Frontmatter schemas for MD/MDX content (design D2).
 * These validate documents at read time; malformed docs are surfaced as errors
 * rather than rendered broken (content-storage spec).
 */

export const ContentType = z.enum(["event", "venue", "organiser", "blog"]);
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

export const EventFrontmatter = z.object({
  title: z.string().min(1),
  start: z.coerce.date(),
  end: z.coerce.date().optional(),
  /** Slug references resolved against venue/organiser records. */
  venue: z.string().min(1),
  organiser: z.string().min(1),
  featuredImage: z.string().optional(),
  excerpt: z.string().optional(),
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
  images: z.array(z.string()).default([]),
  excerpt: z.string().optional(),
  status: PublishStatus.default("published"),
});
export type VenueFrontmatter = z.infer<typeof VenueFrontmatter>;

export const PortfolioItem = z.object({
  image: z.string(),
  title: z.string(),
  description: z.string().optional(),
  externalUrl: z.string().url().optional(),
  /** Slug of an event this portfolio item links to, as an alternative to externalUrl. */
  eventRef: z.string().optional(),
});
export type PortfolioItem = z.infer<typeof PortfolioItem>;

export const OrganiserFrontmatter = z.object({
  name: z.string().min(1),
  ...contact,
  /** Portfolio items live as a frontmatter list on the organiser (design: Resolved Decisions). */
  portfolio: z.array(PortfolioItem).default([]),
  excerpt: z.string().optional(),
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

export const frontmatterByType = {
  event: EventFrontmatter,
  venue: VenueFrontmatter,
  organiser: OrganiserFrontmatter,
  blog: BlogFrontmatter,
} as const;
