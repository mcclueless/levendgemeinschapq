import { cn } from "@/lib/cn";

/** Surface card with hairline border and soft shadow. */
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
  tone = "accent",
  className,
  children,
}: {
  tone?: "accent" | "brand" | "success" | "neutral";
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    accent: "bg-accent/20 text-ink",
    brand: "bg-brand/12 text-brand-strong",
    success: "bg-brand/15 text-brand",
    neutral: "bg-surface-2 text-muted",
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
