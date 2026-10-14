import { Field, Select } from "@/components/admin/form";

/**
 * The organisers of an event on the backend forms. The administrator picks
 * any set. An organisation account's own organisation is shown fixed and
 * posted hidden — the action puts it first whatever arrives — and the select
 * offers the others as co-organisers (organisation-accounts D6; editorial-
 * backend "Event form for an organisation account").
 */
export function OrganisersField({
  organisers,
  own,
  defaults = [],
}: {
  organisers: ReadonlyArray<{ slug: string; name: string }>;
  /** The account's organisation slug; absent for the administrator. */
  own?: string;
  defaults?: readonly string[];
}) {
  if (!own) {
    return (
      <Field label="Organisatoren" htmlFor="organisers" hint="Geen, één of meer. Houd Ctrl/⌘ ingedrukt voor meerdere.">
        <Select id="organisers" name="organisers" multiple className="min-h-32" defaultValue={[...defaults]}>
          {organisers.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </Select>
      </Field>
    );
  }
  const ownName = organisers.find((o) => o.slug === own)?.name ?? own;
  const others = organisers.filter((o) => o.slug !== own);
  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium text-ink">Organisator</p>
      <p className="rounded-md border border-border bg-surface-2 px-3 py-2 text-base text-ink">
        {ownName} <span className="text-sm text-muted">(jouw organisatie)</span>
      </p>
      <input type="hidden" name="organisers" value={own} />
      {others.length > 0 ? (
        <Field label="Mede-organisatoren" htmlFor="organisers" hint="Optioneel. Houd Ctrl/⌘ ingedrukt voor meerdere.">
          <Select
            id="organisers"
            name="organisers"
            multiple
            className="min-h-24"
            defaultValue={defaults.filter((slug) => slug !== own)}
          >
            {others.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
    </div>
  );
}
