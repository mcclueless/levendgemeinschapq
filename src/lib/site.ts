/**
 * Site-wide configuration: canonical identity, navigation, and footer content.
 * Canonical domain decided in design.md (Resolved Decisions): levendegemeenschap.nl.
 * Content language: Dutch-only at launch.
 */
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Levende Gemeenschap",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://levendegemeenschap.nl",
  tagline: "Ontdek wat er speelt in de buurt",
  description:
    "De buurtagenda van de Levende Gemeenschap: vind evenementen, organisatoren en locaties bij jou in de buurt.",
  locale: "nl_NL",
} as const;

/** Primary navigation (Dutch). */
export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/agenda", label: "Agenda" },
  { href: "/projecten", label: "Projecten" },
  { href: "/locaties", label: "Locaties" },
  { href: "/organisatoren", label: "Organisatoren" },
  { href: "/blog", label: "Blog" },
] as const;

/** Footer columns — table of contents, legal, and required static content. */
export const footerNav = [
  {
    title: "Ontdekken",
    links: [
      { href: "/agenda", label: "Agenda" },
      { href: "/projecten", label: "Projecten" },
      { href: "/locaties", label: "Locaties" },
      { href: "/organisatoren", label: "Organisatoren" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Over",
    links: [
      { href: "/over", label: "Over ons" },
      { href: "/contact", label: "Contact" },
      { href: "/evenement-indienen", label: "Evenement indienen" },
    ],
  },
  {
    title: "Juridisch",
    links: [
      { href: "/privacy", label: "Privacyverklaring" },
      { href: "/cookies", label: "Cookiebeleid" },
      { href: "/toegankelijkheid", label: "Toegankelijkheid" },
    ],
  },
] as const;
