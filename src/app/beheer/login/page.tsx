import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Field, Input, SubmitButton } from "@/components/admin/form";
import { login } from "../actions";

export const metadata: Metadata = { title: "Inloggen", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-sm">
        <h1 className="text-3xl">Beheer — inloggen</h1>
        <p className="mt-2 text-sm text-muted">
          Voer het beheerderswachtwoord in.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-terracotta/40 bg-terracotta/10 px-3 py-2 text-sm text-terracotta-strong"
          >
            Onjuist wachtwoord. Probeer het opnieuw.
          </p>
        ) : null}

        <form action={login} className="mt-6 grid gap-4">
          <input type="hidden" name="next" value={next ?? "/beheer"} />
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
