import { SignJWT, jwtVerify } from "jose";

/**
 * Backend sessions. The administrator signs in with an env password; an
 * organisation account with its email and password (organisation-accounts
 * D3). Either way the server issues a signed JWT session cookie carrying the
 * role, and for an organisation the account id, its organisation and `pv`, the
 * moment its password was last set — compared with the account on every
 * backend request so a disabled account or a changed password cuts a session
 * off (D4).
 *
 * This module is edge-safe (jose + Web Crypto) so it can run in middleware.
 * Cookie-name / lifetime constants live in `auth-constants` (jose-free) so
 * client code can import them without pulling crypto into the client bundle;
 * re-exported here for server-side callers' convenience.
 */
export {
  SESSION_COOKIE,
  ADMIN_HINT_COOKIE,
  SESSION_MAX_AGE,
} from "./auth-constants";

export type Session =
  | { role: "admin" }
  | {
      role: "organisation";
      /** The account's id. */
      sub: string;
      /** The organiser slug the account is scoped to. */
      org: string;
      /** `passwordChangedAt` of the account when the session started, in seconds. */
      pv: number;
    };

const SESSION_TTL = "7d";

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    // Dev fallback keeps local runs working; production must set AUTH_SECRET.
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required in production");
    }
    return new TextEncoder().encode("dev-only-insecure-secret-change-me");
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken(session: Session = { role: "admin" }): Promise<string> {
  const claims =
    session.role === "admin"
      ? { role: "admin" }
      : { role: "organisation", org: session.org, pv: session.pv };
  const jwt = new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL);
  if (session.role === "organisation") jwt.setSubject(session.sub);
  return jwt.sign(secret());
}

/** The session a token proves, or null for a missing, tampered or foreign one. */
export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role === "admin") return { role: "admin" };
    if (
      payload.role === "organisation" &&
      typeof payload.sub === "string" &&
      typeof payload.org === "string" &&
      typeof payload.pv === "number"
    ) {
      return { role: "organisation", sub: payload.sub, org: payload.org, pv: payload.pv };
    }
    return null;
  } catch {
    return null;
  }
}

/** Validate the admin password against the configured value. */
export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Length-aware constant-ish comparison.
  if (password.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < password.length; i++) {
    diff |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
