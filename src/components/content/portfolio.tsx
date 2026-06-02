import Link from "next/link";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import type { PortfolioItem } from "@/content/schema";

function fallbackGradient(seed: string): string {
  const pairs = [
    ["#e7c98f", "#d99224"],
    ["#d98c6a", "#b8502e"],
    ["#8fae90", "#436145"],
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const [a, b] = pairs[Math.abs(hash) % pairs.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

/**
 * Organiser portfolio (organisers spec). A grid of items; each opens its
 * description with either an external link or a link to a related event.
 */
export function Portfolio({ items }: { items: PortfolioItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const href = item.eventRef
          ? routes.event(item.eventRef)
          : item.externalUrl;
        const external = Boolean(item.externalUrl) && !item.eventRef;

        return (
          <li key={item.title}>
            <Card as="article" className="h-full overflow-hidden">
              {item.image ? (
                // next/image optimization wired with the media CDN in Group 10.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="h-40 w-full"
                  style={{ background: fallbackGradient(item.title) }}
                />
              )}
              <div className="p-5">
                <h3 className="text-lg">{item.title}</h3>
                {item.description ? (
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                ) : null}
                {href ? (
                  <p className="mt-3">
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-terracotta-strong hover:underline"
                      >
                        Bekijk →
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-sm font-medium text-terracotta-strong hover:underline"
                      >
                        Naar het evenement →
                      </Link>
                    )}
                  </p>
                ) : null}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
