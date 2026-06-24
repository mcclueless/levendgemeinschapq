import { Field, Input } from "@/components/admin/form";
import { SOCIAL_PLATFORMS, type Socials } from "@/content/schema";

/** Human labels for the curated social platforms (editorial-enrichments). */
export const SOCIAL_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

/**
 * Curated social-link URL inputs shared by the Event and Organiser forms. Each
 * field name matches a `socials` key, so the action's `socialsFrom` reads them
 * directly. `defaults` prefills the edit form.
 */
export function SocialFields({ defaults }: { defaults?: Socials }) {
  return (
    <fieldset className="grid gap-4 rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-medium text-ink">
        Sociale media (optioneel)
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map((p) => (
          <Field key={p} label={SOCIAL_LABELS[p]} htmlFor={p}>
            <Input
              id={p}
              name={p}
              type="url"
              placeholder="https://"
              defaultValue={defaults?.[p] ?? ""}
            />
          </Field>
        ))}
      </div>
    </fieldset>
  );
}
