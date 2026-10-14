import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing for organisation accounts (organisation-accounts D2).
 * Node's own scrypt, so no dependency: a handful of accounts does not justify
 * one. The stored form names its parameters —
 * `scrypt$N$r$p$<salt base64>$<hash base64>` — so they can be raised later
 * without invalidating existing hashes.
 */

const scrypt = promisify(scryptCb);

/** Twelve characters, no other rule: length is what resists guessing. */
export const PASSWORD_MIN_LENGTH = 12;

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export function isAcceptablePassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

async function derive(password: string, salt: Buffer, n: number, r: number, p: number) {
  return (await scrypt(password, salt, KEY_LENGTH, { N: n, r, p, maxmem: 128 * n * r * 2 })) as Buffer;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = await derive(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

/** True when `password` produced `stored`. A malformed `stored` is simply false. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (salt.length === 0 || expected.length !== KEY_LENGTH) return false;
  let actual: Buffer;
  try {
    actual = await derive(password, salt, Number(n), Number(r), Number(p));
  } catch {
    return false;
  }
  return timingSafeEqual(actual, expected);
}
