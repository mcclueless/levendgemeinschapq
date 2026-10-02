import { site } from "./site";
import type { BlogPost, CalendarEvent, Organiser, Venue } from "@/content/types";

/** Absolute URL for a site-relative path. */
export const absolute = (path: string) => `${site.url}${path}`;
/** A media URL as an absolute one: stored media may be a full CDN URL or a site path. */
const absoluteMedia = (url: string) => (/^https?:\/\//.test(url) ? url : absolute(url));

/**
 * Structured data for the occurrence an event page presents: its own start and
 * its own end (event-multiple-dates D4). Emitting `event.end` here paired a later
 * occurrence's start with the first occurrence's end.
 */
export function eventJsonLd(
  event: CalendarEvent,
  occurrence: { start: Date; end?: Date },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: occurrence.start.toISOString(),
    ...(occurrence.end ? { endDate: occurrence.end.toISOString() } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    description: event.excerpt,
    ...(event.featuredImage ? { image: [event.featuredImage] } : {}),
    ...(event.venue
      ? {
          location: {
            "@type": "Place",
            name: event.venue.name,
            ...(event.venue.address ? { address: event.venue.address } : {}),
          },
        }
      : {}),
    // One organiser as an object, several as a list; schema.org accepts both
    // (event-multiple-organisers D5).
    ...(event.organisers.length > 0
      ? {
          organizer:
            event.organisers.length === 1
              ? organization(event.organisers[0])
              : event.organisers.map(organization),
        }
      : {}),
    url: absolute(event.href),
  };
}

function organization(organiser: Organiser) {
  return { "@type": "Organization", name: organiser.name, url: absolute(organiser.href) };
}

export function venueJsonLd(venue: Venue) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: venue.name,
    description: venue.excerpt,
    ...(venue.address ? { address: venue.address } : {}),
    ...(venue.lat != null && venue.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: venue.lat, longitude: venue.lng } }
      : {}),
    ...(venue.phone ? { telephone: venue.phone } : {}),
    url: absolute(venue.href),
  };
}

export function organiserJsonLd(organiser: Organiser) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organiser.name,
    description: organiser.excerpt,
    ...(organiser.email ? { email: organiser.email } : {}),
    ...(organiser.phone ? { telephone: organiser.phone } : {}),
    ...(organiser.website ? { sameAs: [organiser.website] } : {}),
    // The organiser's own logo and pictures (organiser-page-layout D6).
    ...(organiser.logo ? { logo: absoluteMedia(organiser.logo) } : {}),
    ...(organiser.images.length > 0 ? { image: organiser.images.map(absoluteMedia) } : {}),
    url: absolute(organiser.href),
  };
}

export function blogPostingJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date.toISOString(),
    author: { "@type": "Person", name: post.author },
    description: post.excerpt,
    ...(post.featuredImage ? { image: [post.featuredImage] } : {}),
    url: absolute(post.href),
  };
}

/** Site-level Organization + WebSite, emitted once on the home page. */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: site.name,
        url: site.url,
        description: site.description,
      },
      {
        "@type": "WebSite",
        name: site.name,
        url: site.url,
        inLanguage: "nl-NL",
      },
    ],
  };
}
