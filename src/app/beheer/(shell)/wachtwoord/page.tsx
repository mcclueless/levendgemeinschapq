import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Field, FormError, Input, SubmitButton } from "@/components/admin/form";
import { Notice } from "@/components/ui/notice";
import { requireSession } from "@/lib/auth-server";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { changeOwnPasswordAction } from "@/app/beheer/actions";

export const metadata: Metadata = { title: "Wachtwoord", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * An organisation account changes its own password (organisation-accounts
 * D8). The administrator's password lives in the environment, so this page
 * is the organisation account's alone.
 */
export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; gewijzigd?: string }>;
}) {
  const actor = await requireSession();
  if (actor.role !== "organisation") redirect("/beheer");
  const { error, gewijzigd } = await searchParams;

  return (
    <>
      <h1 className="text-3xl">Wachtwoord wijzigen</h1>
      <p className="mt-2 text-muted">Voor {actor.user.email}.</p>
      <FormError code={error} />
      {gewijzigd ? <Notice className="mt-4">Wachtwoord gewijzigd.</Notice> : null}
      <form action={changeOwnPasswordAction} className="mt-8 grid max-w-sm gap-5">
        <Field label="Huidig wachtwoord" htmlFor="current" required>
          <Input id="current" name="current" type="password" required autoComplete="current-password" />
        </Field>
        <Field label="Nieuw wachtwoord" htmlFor="password" required hint={`Minstens ${PASSWORD_MIN_LENGTH} tekens.`}>
          <Input id="password" name="password" type="password" required minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" />
        </Field>
        <Field label="Nieuw wachtwoord nogmaals" htmlFor="repeat" required>
          <Input id="repeat" name="repeat" type="password" required minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" />
        </Field>
        <div>
          <SubmitButton>Wachtwoord wijzigen</SubmitButton>
        </div>
      </form>
    </>
  );
}
