import { cn } from "@/lib/cn";

/** Surface card with warm hairline border and soft shadow. */
export function Card({
  as: Tag = "div",
  className,
  children,
}: {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "rounded-lg border border-border bg-surface shadow-card",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Small rounded label, e.g. a category or date pill. */
export function Badge({
  tone = "saffron",
  className,
  children,
}: {
  tone?: "saffron" | "terracotta" | "forest" | "neutral";
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    saffron: "bg-saffron/20 text-ink",
    terracotta: "bg-terracotta/12 text-terracotta-strong",
    forest: "bg-forest/15 text-forest",
    neutral: "bg-sand text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-1 text-sm font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
