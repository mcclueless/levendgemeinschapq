import { site } from "./site";
import type { BlogPost, CalendarEvent, Organiser, Venue } from "@/content/types";

/** Absolute URL for a site-relative path. */
export const absolute = (path: string) => `${site.url}${path}`;

export function eventJsonLd(event: CalendarEvent, when: Date) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: when.toISOString(),
    ...(event.end ? { endDate: event.end.toISOString() } : {}),
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
    ...(event.organiser
      ? {
          organizer: {
            "@type": "Organization",
            name: event.organiser.name,
            url: absolute(event.organiser.href),
          },
        }
      : {}),
    url: absolute(event.href),
  };
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
