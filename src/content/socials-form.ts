import { SOCIAL_PLATFORMS, type Socials } from "./schema";

/**
 * Social-link *form* parsing (docs/bugs/invalid-social-url-hides-event.md).
 *
 * Writing a social URL without validating it, while `SocialsSchema` validates
 * on read, made the whole document unparseable — and `parseAll` skips what
 * fails, so the event disappeared from the public site, from its own page, and
 * from the backend list at once, with no UI path back to it. The most likely
 * trigger was the most natural thing to type: a profile URL with no scheme.
 *
 * So validation must happen here, on write, and must agree exactly with what
 * the schema accepts. Shared by the editorial backend and (once it gains social
 * fields) the public submission form, so the two cannot drift apart.
 */

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialsFormResult =
  | { ok: true; socials: Socials }
  | { ok: false; platform: SocialPlatform };

function raw(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

/**
 * Add a scheme to a bare profile address so `instagram.com/buurttuin` is
 * accepted rather than rejected. Normalising is friendlier than refusing, and a
 * scheme-less value is what people actually paste.
 */
function withScheme(value: string): string {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}

/**
 * Only web URLs. `z.string().url()` alone accepts `javascript:alert(1)`, and
 * `social-links.tsx` renders the value straight into an `href` — so the scheme
 * check is what actually closes that hole, not the URL parse.
 */
export function isWebUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Read the social fields from a form, normalising and validating each one.
 * Returns the offending platform on failure so the caller can name it.
 * Platforms left empty are omitted; none set at all yields `undefined`, which
 * `serialize` then drops from the frontmatter entirely.
 */
export function socialsFromForm(form: FormData): SocialsFormResult {
  const entries: [SocialPlatform, string][] = [];

  for (const platform of SOCIAL_PLATFORMS) {
    const value = raw(form, platform);
    if (!value) continue;
    const url = withScheme(value);
    if (!isWebUrl(url)) return { ok: false, platform };
    entries.push([platform, url]);
  }

  return {
    ok: true,
    socials: entries.length
      ? (Object.fromEntries(entries) as Socials)
      : undefined,
  };
}
