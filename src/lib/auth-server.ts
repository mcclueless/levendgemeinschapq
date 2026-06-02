import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

/** Whether the current request has a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Redirect to login unless authenticated (defense in depth beyond middleware). */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/beheer/login");
}
