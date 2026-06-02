import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { MDXComponents } from "mdx/types";
import { UpcomingEvents } from "@/components/events/upcoming-events";

/**
 * MDX render pipeline (design D2/D4). Renders content bodies to accessible HTML
 * and exposes a small component vocabulary so editors can embed reusable
 * elements — notably event listings — inside pages and posts (events spec 3.5).
 */
const components: MDXComponents = {
  a: ({ href = "#", children, ...rest }) => {
    const external = /^https?:\/\//.test(href);
    return external ? (
      <a
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        className="text-terracotta-strong underline underline-offset-2"
        {...rest}
      >
        {children}
      </a>
    ) : (
      <Link
        href={href}
        className="text-terracotta-strong underline underline-offset-2"
      >
        {children}
      </Link>
    );
  },
  // Embeddable, self-resolving event listing.
  UpcomingEvents,
};

export function Mdx({ source }: { source: string }) {
  return (
    <div className="prose-warm">
      <MDXRemote source={source} components={components} />
    </div>
  );
}
