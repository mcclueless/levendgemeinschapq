import Link from "next/link";

/** Section title with an optional "See more…" link (events spec: listings). */
export function SectionHeading({
  title,
  subtitle,
  moreHref,
  moreLabel = "Meer bekijken",
}: {
  title: string;
  subtitle?: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-muted">{subtitle}</p>
        ) : null}
      </div>
      {moreHref ? (
        <Link
          href={moreHref}
          className="shrink-0 font-medium text-terracotta-strong underline-offset-4 hover:underline"
        >
          {moreLabel} →
        </Link>
      ) : null}
    </div>
  );
}
