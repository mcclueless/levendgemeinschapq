/**
 * Renders a schema.org JSON-LD block (seo-discoverability spec). Structured data
 * exposes the key facts (what/when/where/who) so search and AI engines can
 * extract and cite them.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Content is server-generated from validated frontmatter.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
