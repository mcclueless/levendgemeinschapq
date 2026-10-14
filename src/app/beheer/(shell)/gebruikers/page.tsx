import type { Metadata } from "next";
import { Field, FormError, Input, Select, SubmitButton } from "@/components/admin/form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireAdmin } from "@/lib/auth-server";
import { listUsers } from "@/content/users";
import { listContent } from "@/content/admin";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import {
  createUserAction,
  resetUserPasswordAction,
  setUserDisabledAction,
} from "@/app/beheer/actions";

export const metadata: Metadata = { title: "Gebruikers", robots: { index: false } };
export const dynamic = "force-dynamic";

const MESSAGE: Record<string, string> = {
  aangemaakt: "Account aangemaakt. Geef het wachtwoord persoonlijk door.",
  "wachtwoord-gereset": "Wachtwoord gereset. Geef het nieuwe wachtwoord persoonlijk door.",
  uitgeschakeld: "Account uitgeschakeld. Een lopende sessie stopt bij de volgende pagina.",
  ingeschakeld: "Account weer ingeschakeld.",
};

const TZ = "Europe/Amsterdam";
const dayFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });

/**
 * Organisation accounts (organisation-accounts D8): the administrator creates
 * them, resets their password and switches them off and on. Passwords are
 * handed over in person; nothing is sent.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; gebruiker?: string }>;
}) {
  await requireAdmin();
  const [{ error, gebruiker }, users, organisers] = await Promise.all([
    searchParams,
    listUsers(),
    listContent("organiser"),
  ]);
  const organiserName = new Map(organisers.map((o) => [o.slug, o.title]));
  const byName = [...organisers].sort((a, b) => a.title.localeCompare(b.title, "nl"));
  const control = "inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-2";

  return (
    <>
      <h1 className="text-3xl">Gebruikers</h1>
      <p className="mt-2 text-muted">
        Accounts van organisaties. Een account hoort bij één organisatie en beheert daarvan
        de pagina en de evenementen waarvan die organisatie de organisator is.
      </p>

      <FormError code={error} />
      {gebruiker && MESSAGE[gebruiker] ? <Notice className="mt-4">{MESSAGE[gebruiker]}</Notice> : null}

      <h2 className="mt-10 text-xl">Nieuw account</h2>
      {byName.length === 0 ? (
        <p className="mt-2 text-muted">Maak eerst een organisator aan; een account hoort bij een organisatie.</p>
      ) : (
        <form action={createUserAction} className="mt-4 grid max-w-2xl gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="E-mailadres" htmlFor="email" required hint="Hiermee logt de persoon in.">
              <Input id="email" name="email" type="email" required autoComplete="off" />
            </Field>
            <Field label="Naam" htmlFor="name" required>
              <Input id="name" name="name" required autoComplete="off" />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Organisatie" htmlFor="organisation" required>
              <Select id="organisation" name="organisation" required defaultValue="">
                <option value="" disabled>
                  Kies een organisatie
                </option>
                {byName.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Wachtwoord"
              htmlFor="password"
              required
              hint={`Minstens ${PASSWORD_MIN_LENGTH} tekens. Geef het persoonlijk door; het wordt niet gemaild.`}
            >
              <Input id="password" name="password" type="text" required minLength={PASSWORD_MIN_LENGTH} autoComplete="off" />
            </Field>
          </div>
          <div>
            <SubmitButton>Account aanmaken</SubmitButton>
          </div>
        </form>
      )}

      <h2 className="mt-12 text-xl">Accounts</h2>
      {users.length === 0 ? (
        <p className="mt-2 text-muted">Nog geen accounts.</p>
      ) : (
        <ul className="mt-4 grid gap-4">
          {users.map((u) => (
            <li key={u.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium text-ink">{u.name}</span>
                <span className="text-sm text-muted">{u.email}</span>
                {u.disabled ? (
                  <Badge tone="neutral">Uitgeschakeld</Badge>
                ) : (
                  <Badge tone="success">Actief</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                Organisatie: {organiserName.get(u.organisation) ?? `${u.organisation} (onbekend)`} ·
                aangemaakt {dayFmt.format(u.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <form action={resetUserPasswordAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <div className="grid gap-1">
                    <label htmlFor={`pw-${u.id}`} className="text-xs text-muted">
                      Nieuw wachtwoord (minstens {PASSWORD_MIN_LENGTH} tekens)
                    </label>
                    <Input id={`pw-${u.id}`} name="password" type="text" required minLength={PASSWORD_MIN_LENGTH} autoComplete="off" className="h-9 py-1 text-sm" />
                  </div>
                  <button type="submit" className={control}>
                    Wachtwoord resetten
                  </button>
                </form>
                <form action={setUserDisabledAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="disabled" value={u.disabled ? "" : "1"} />
                  {u.disabled ? (
                    <button type="submit" className={control}>
                      Inschakelen
                    </button>
                  ) : (
                    <ConfirmButton
                      message={`Het account van ${u.name} uitschakelen? De persoon kan dan niet meer inloggen.`}
                      className={control}
                    >
                      Uitschakelen
                    </ConfirmButton>
                  )}
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
