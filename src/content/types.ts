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
  /** Every image, cover first; empty when there are none (organiser-page-layout). */
  images: string[];
  logo?: string;
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
  /** Every organiser, sorted by name; empty when the event names none. */
  organisers: Organiser[];
  /** An agenda marker: listed by date, but no page, link or time. */
  noPage: boolean;
  /** Leads to the organisation's own page instead of one here (event-external-link D1). */
  externalUrl?: string;
  featuredImage?: string;
  excerpt?: string;
  socials?: Socials;
  recurrence?: Recurrence;
  /**
   * Listed by its next occurrence alone, not one entry per occurrence
   * (event-recurring-next-only D1). Only meaningful with a `recurrence`.
   */
  nextOccurrenceOnly?: boolean;
  /** Further dates beyond `start`, normalised; absent when there are none. */
  dates?: Date[];
  uid?: string;
  status: PublishStatus;
  body: string;
  href: string;
}

/**
 * A single dated occurrence of an event (recurring events and date series yield
 * several). `end` is this occurrence's own end — its start plus the event's
 * duration — so no surface pairs a later start with the first occurrence's end.
 */
export interface EventOccurrence {
  event: CalendarEvent;
  start: Date;
  end?: Date;
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
