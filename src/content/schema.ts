import { z } from "zod";
// Relative, not "@/": this module is also loaded by the `reindex` CLI.
import { parseStoredDateTime } from "../lib/date";
import { readStoredDates } from "./event-dates";

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

/**
 * An event datetime, read the same whatever the server's timezone. See
 * `parseStoredDateTime` for why an offset-less value means UTC.
 */
const eventDateTime = () => z.preprocess(parseStoredDateTime, z.date());

export const EventFrontmatter = z.object({
  title: z.string().min(1),
  start: eventDateTime(),
  end: eventDateTime().optional(),
  /**
   * Further dates of an irregular series (event-multiple-dates D1), each read
   * as site time like `start`. Optional, and read leniently — an unreadable
   * entry is dropped rather than failing the document, which `parseAll` would
   * silently skip. Mutually exclusive with `recurrence` at the form layer only
   * (D2); expansion prefers the recurrence if both are somehow stored.
   */
  dates: z.preprocess(readStoredDates, z.array(z.date()).optional()),
  /**
   * Slug references resolved against venue/organiser records. Optional: plenty
   * of real entries have no fixed address or no organisation behind them, and
   * requiring one only got a wrong address typed in. `min(1)` stays inside the
   * optional, so a reference is a real slug or absent — never an empty string.
   */
  venue: z.string().min(1).optional(),
  organiser: z.string().min(1).optional(),
  featuredImage: z.string().optional(),
  excerpt: z.string().optional(),
  socials: SocialsSchema,
  recurrence: RecurrenceSchema.optional(),
  /** Calendar UID for import de-duplication (calendar-import spec). */
  uid: z.string().optional(),
  /**
   * Which saved feed produced this event (add-managed-calendar-feeds D5).
   * Scopes cancellation-hiding so a sync can only ever hide its own events.
   *
   * Optional on purpose: events imported before feeds existed carry a `uid` but
   * no `feedId`, and `parseAll` *skips* documents that fail validation — a
   * required field would silently remove every one of them from the public site
   * and the backend list. They are adopted on the next sync instead.
   */
  feedId: z.string().optional(),
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
 * Organiser *references* (resolved to records at read time): an optional venue,
 * one or more organisers. `date` is stamped automatically on save and used only
 * for newest-first ordering — it is not an editor-entered field (design D2).
 * Admin-only: no submission/review metadata (design D4).
 */
export const ProjectFrontmatter = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  /**
   * Slug references resolved against venue/organiser records. The location is
   * optional — an initiative can cover the whole neighbourhood — but a project
   * still names who is behind it.
   */
  venue: z.string().min(1).optional(),
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
