/**
 * Inline status/feedback banner shared across the site (e.g. "Opgeslagen",
 * "Verborgen van de website"). One place for the tone styling so confirmations
 * stay visually consistent and WCAG-compliant.
 */
const TONES = {
  success: "border-brand/30 bg-brand/10 text-brand",
  // Gold accent (not green) so a caution reads as a caution and is clearly
  // distinct from a success confirmation; gold pairs with ink text for AA.
  warning: "border-accent/50 bg-accent/15 text-ink",
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
