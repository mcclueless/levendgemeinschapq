import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./auth";
import { getUser, type User } from "@/content/users";

/** The session the request's cookie proves, or null. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Whether the current request has a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  return (await getSession())?.role === "admin";
}

/** Where a request without a usable session is sent. */
const LOGIN = "/beheer/login";
/** Where an organisation session is sent from an admin-only page or action. */
export const ADMIN_ONLY = "/beheer?alleen=beheerder";

/**
 * An organisation session is valid only while its account still exists, is
 * enabled, and has not had its password changed since the session started
 * (organisation-accounts D4). One store read per backend request.
 */
async function currentUser(session: Session): Promise<User | null> {
  if (session.role !== "organisation") return null;
  const user = await getUser(session.sub);
  if (!user || user.disabled) return null;
  if (Math.floor(user.passwordChangedAt.getTime() / 1000) > session.pv) return null;
  return user;
}

export type Actor =
  | { role: "admin" }
  | { role: "organisation"; user: User };

/**
 * The signed-in actor, or a redirect to the login page: no session, or an
 * organisation session whose account is gone, disabled or re-passworded.
 * Defense in depth beyond the middleware, which checks only the signature.
 */
export async function requireSession(): Promise<Actor> {
  const session = await getSession();
  if (!session) redirect(LOGIN);
  if (session.role === "admin") return { role: "admin" };
  const user = await currentUser(session);
  if (!user) redirect(`${LOGIN}?reden=verlopen`);
  return { role: "organisation", user };
}

/**
 * Redirect unless the administrator: to login without a session, and to the
 * overview with a notice for an organisation account, which is signed in but
 * not allowed here (D3).
 */
export async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session) redirect(LOGIN);
  if (session.role !== "admin") redirect(ADMIN_ONLY);
}
