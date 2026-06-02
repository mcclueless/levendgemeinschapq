import { SignJWT, jwtVerify } from "jose";

/**
 * Interim admin auth (design D6 interim note). A single Administrator signs in
 * with an env password; we issue a signed JWT session cookie. Multi-user auth
 * (Auth.js magic-link) replaces this before limited-user features ship.
 *
 * This module is edge-safe (jose + Web Crypto) so it can run in middleware.
 */
export const SESSION_COOKIE = "lg_session";
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

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secret());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
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
