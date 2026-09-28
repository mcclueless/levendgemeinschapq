import Link from "next/link";
import { MDXRemote, compileMDX } from "next-mdx-remote/rsc";
import type { MDXComponents } from "mdx/types";
import { UpcomingEvents } from "@/components/events/upcoming-events";

/**
 * MDX render pipeline (design D2/D4). Renders content bodies to accessible HTML
 * and exposes a small component vocabulary so editors can embed reusable
 * elements — notably event listings — inside pages and posts (events spec 3.5).
 */
export const components: MDXComponents = {
  a: ({ href = "#", children, ...rest }) => {
    const external = /^https?:\/\//.test(href);
    return external ? (
      <a
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        className="text-brand-strong underline underline-offset-2"
        {...rest}
      >
        {children}
      </a>
    ) : (
      <Link
        href={href}
        className="text-brand-strong underline underline-offset-2"
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

/**
 * Compile a body up front and return it wrapped as the page wraps it
 * (body-editor-toolbar D5). Same components and the same library defaults as
 * {@link Mdx}, so a preview matches the public page. Compiling here, rather than
 * returning `<Mdx>`, lets a caller catch a body the compiler rejects — inside
 * `<Mdx>` the error surfaces during streaming, out of the caller's reach.
 */
export async function compileBody(source: string): Promise<React.ReactElement> {
  const { content } = await compileMDX({ source, components });
  return <div className="prose-warm">{content}</div>;
}
