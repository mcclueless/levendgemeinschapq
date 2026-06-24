/**
 * Cookie/session constants safe to import from BOTH client and server code.
 *
 * Kept separate from auth.ts on purpose: auth.ts pulls in `jose` for JWT
 * signing/verification, so client components (e.g. the admin-presence hint
 * reader) import the names from here to avoid dragging server crypto into the
 * client bundle.
 */
export const SESSION_COOKIE = "lg_session";

/**
 * Client-readable hint set alongside SESSION_COOKIE. It is NOT proof of
 * authorization — only a signal the client uses to reveal admin UI. All
 * privileged actions stay gated by the (httpOnly) session and middleware.
 */
export const ADMIN_HINT_COOKIE = "lg_admin";

/** Session lifetime in seconds (7 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
