import type { PublishStatus, Recurrence, Socials } from "./schema";

/** Resolved domain models used by the UI (references resolved to objects). */

export interface Venue {
  slug: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  lat?: number;
  lng?: number;
  featuredImage?: string;
  images: string[];
  excerpt?: string;
  status: PublishStatus;
  /** MDX body (description). */
  body: string;
  href: string;
}

export interface Organiser {
  slug: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  /** Linked Location — a Venue slug (resolved at render time). */
  location?: string;
  featuredImage?: string;
  excerpt?: string;
  socials?: Socials;
  status: PublishStatus;
  body: string;
  href: string;
}

export interface CalendarEvent {
  slug: string;
  title: string;
  start: Date;
  end?: Date;
  venue: Venue | null;
  organiser: Organiser | null;
  featuredImage?: string;
  excerpt?: string;
  socials?: Socials;
  recurrence?: Recurrence;
  uid?: string;
  status: PublishStatus;
  body: string;
  href: string;
}

/** A single dated occurrence of an event (recurring events yield several). */
export interface EventOccurrence {
  event: CalendarEvent;
  start: Date;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: Date;
  author: string;
  featuredImage?: string;
  excerpt?: string;
  /** Venue/Organiser info blocks rendered at the end of the post. */
  relatedVenues: Venue[];
  relatedOrganisers: Organiser[];
  status: PublishStatus;
  body: string;
  href: string;
}

/**
 * A neighbourhood project (projects spec): one resolved Location and one or
 * more resolved Organisers. `date` is the auto-stamped ordering key.
 */
export interface Project {
  slug: string;
  title: string;
  date: Date;
  venue: Venue | null;
  organisers: Organiser[];
  featuredImage?: string;
  excerpt?: string;
  status: PublishStatus;
  body: string;
  href: string;
}
