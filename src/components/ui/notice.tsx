/**
 * Inline status/feedback banner shared across the site (e.g. "Opgeslagen",
 * "Verborgen van de website"). One place for the tone styling so confirmations
 * stay visually consistent and WCAG-compliant.
 */
const TONES = {
  success: "border-forest/30 bg-forest/10 text-forest",
  warning: "border-terracotta/40 bg-terracotta/10 text-terracotta-strong",
} as const;

export function Notice({
  children,
  tone = "success",
  role = "status",
  className = "",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
  role?: "status" | "alert";
  className?: string;
}) {
  return (
    <p
      role={role}
      className={`rounded-md border px-3 py-2 text-sm ${TONES[tone]} ${className}`}
    >
      {children}
    </p>
  );
}
