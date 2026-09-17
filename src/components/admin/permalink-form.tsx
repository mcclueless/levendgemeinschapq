import { Field, Input } from "@/components/admin/form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { changePermalink } from "@/app/beheer/actions";
import type { PermalinkType } from "@/content/permalink";
import { routes } from "@/lib/routes";
import { site } from "@/lib/site";

/** Public URL prefix per type, shown in front of the permalink input. */
const PREFIX: Record<PermalinkType, string> = {
  venue: routes.venues,
  organiser: routes.organisers,
  project: routes.projects,
};

/** Messages for `?permalink=`, one per outcome of the rename (D5). */
const MESSAGES: Record<string, { text: string; ok?: boolean }> = {
  ok: { text: "De permalink is gewijzigd. Het oude webadres werkt niet meer.", ok: true },
  empty: {
    text: "Deze permalink is leeg. Gebruik letters of cijfers, bijvoorbeeld thee-resia-samentuin.",
  },
  unchanged: { text: "Dit is al de huidige permalink — er is niets gewijzigd." },
  taken: {
    text: "Deze permalink is al in gebruik door een ander item van dit type (mogelijk een verborgen item). Kies een andere, of verwijder dat item eerst.",
  },
};

/**
 * Change the permalink of a Location, Organiser, or Project (editable-permalinks
 * D6). Deliberately its own form below the content form: a rename rewrites
 * everything that links to the item and removes the old address, so it gets its
 * own button and confirmation rather than riding along with "Opslaan".
 */
export function PermalinkForm({
  type,
  slug,
  status,
}: {
  type: PermalinkType;
  slug: string;
  /** The `?permalink=` value from the previous attempt, if any. */
  status?: string;
}) {
  const message = status ? MESSAGES[status] : undefined;
  const prefix = `${site.url.replace(/^https?:\/\//, "")}${PREFIX[type]}/`;

  return (
    <section className="mt-12 max-w-2xl border-t border-border pt-8">
      <h2 className="text-xl">Permalink</h2>
      <p className="mt-2 text-sm text-muted">
        Het webadres van deze pagina. Na een wijziging werkt het oude adres niet
        meer: gedeelde links en zoekresultaten naar het oude adres geven dan een
        foutpagina. Alles op de website dat naar deze pagina verwijst, wordt
        automatisch bijgewerkt — behalve links die met de hand in een tekst zijn
        getypt.
      </p>
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className="mt-4 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong"
        >
          {message.text}
        </p>
      ) : null}
      <form action={changePermalink} className="mt-5 grid gap-4">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="slug" value={slug} />
        <Field
          label="Nieuwe permalink"
          htmlFor="permalink"
          required
          hint="Hoofdletters, spaties en accenten worden automatisch omgezet, bijvoorbeeld “Thee-resia Samentuin” wordt thee-resia-samentuin."
        >
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted">{prefix}</span>
            <Input id="permalink" name="permalink" required defaultValue={slug} />
          </div>
        </Field>
        <div>
          <ConfirmButton
            message="Permalink wijzigen? Het oude webadres werkt daarna niet meer."
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-brand-strong hover:bg-surface-2"
          >
            Permalink wijzigen
          </ConfirmButton>
        </div>
      </form>
    </section>
  );
}
