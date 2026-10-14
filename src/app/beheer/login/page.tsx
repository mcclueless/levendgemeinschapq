import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Field, Input, SubmitButton } from "@/components/admin/form";
import { login } from "../actions";

export const metadata: Metadata = { title: "Inloggen", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reden?: string }>;
}) {
  const { error, next, reden } = await searchParams;

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-sm">
        <h1 className="text-3xl">Beheer — inloggen</h1>
        <p className="mt-2 text-sm text-muted">
          Heb je een account van je organisatie, vul dan je e-mailadres en
          wachtwoord in. De beheerder laat het e-mailadres leeg.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong"
          >
            Inloggen is niet gelukt. Controleer het e-mailadres en wachtwoord.
          </p>
        ) : null}
        {reden === "verlopen" ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-strong"
          >
            Je sessie is niet meer geldig: je wachtwoord is gewijzigd of je
            account is uitgeschakeld. Log opnieuw in.
          </p>
        ) : null}

        <form action={login} className="mt-6 grid gap-4">
          <input type="hidden" name="next" value={next ?? "/beheer"} />
          <Field
            label="E-mailadres"
            htmlFor="email"
            hint="Alleen voor een organisatie-account."
          >
            <Input id="email" name="email" type="email" autoComplete="username" />
          </Field>
          <Field label="Wachtwoord" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <SubmitButton>Inloggen</SubmitButton>
        </form>
      </div>
    </Container>
  );
}
