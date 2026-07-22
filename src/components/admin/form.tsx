import { cn } from "@/lib/cn";

/** Shared, accessible form primitives for the editorial backend. */

export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-brand-strong"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const control =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-1";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, props.className)} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <textarea {...props} className={cn(control, "min-h-32", props.className)} />;
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(control, props.className)}>
      {children}
    </select>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border"
      />
      {label}
    </label>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex h-11 items-center rounded-md bg-brand-strong px-5 font-medium text-white hover:bg-brand"
    >
      {children}
    </button>
  );
}

/**
 * Messages for the `?error=` flag the content actions redirect back with.
 * Shared so the create and edit forms — and the public submission form — cannot
 * describe the same failure differently (add-recurrence-end-date D5).
 */
export const FORM_ERRORS: Record<string, string> = {
  "1": "Vul alle verplichte velden in.",
  "recurrence-missing":
    "Kies een einddatum voor de herhaling — een herhalend evenement moet een einddatum hebben.",
  "recurrence-range":
    "De einddatum van de herhaling ligt vóór de startdatum van het evenement.",
  "range-end-before-start":
    "Het einde van het evenement ligt vóór de start. Controleer de start- en einddatum.",
  "upload-type":
    "Dit bestandstype kan niet worden geüpload. Gebruik een JPG, PNG, GIF, WebP of AVIF (geen SVG).",
  "upload-size":
    "De afbeelding is te groot. Maximaal 10 MB — verklein de foto en probeer het opnieuw.",
  "upload-corrupt":
    "Het bestand lijkt geen geldige afbeelding te zijn. Controleer of je de juiste foto hebt gekozen.",
};

/** Platform labels for the `socials-<platform>` error codes. */
const SOCIAL_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

function messageFor(code: string): string | undefined {
  if (FORM_ERRORS[code]) return FORM_ERRORS[code];
  // `socials-<platform>` — name the offending field rather than making the
  // editor hunt through five inputs.
  const platform = code.startsWith("socials-") ? code.slice(8) : undefined;
  if (platform && SOCIAL_LABEL[platform]) {
    return `De ${SOCIAL_LABEL[platform]}-link is geen geldig webadres. Gebruik een volledige URL, bijvoorbeeld https://${platform}.com/jouwnaam.`;
  }
  return undefined;
}

/** Renders the message for an `?error=` value, or nothing when absent/unknown. */
export function FormError({ code }: { code?: string }) {
  const message = code ? messageFor(code) : undefined;
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-4 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong"
    >
      {message}
    </p>
  );
}
