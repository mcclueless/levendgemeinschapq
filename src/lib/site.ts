/**
 * Site-wide configuration: canonical identity, navigation, and footer content.
 * Canonical origin: goeddoen.net (adopt-goeddoen-net-domain D1). The apex is
 * canonical; www redirects to it. Overridden per deployment by
 * NEXT_PUBLIC_SITE_URL.
 * Content language: Dutch-only at launch.
 */
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Goeddoen",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://goeddoen.net",
  tagline: "Ontdek wat er speelt in de buurt",
  description:
    "De buurtagenda van Goeddoen: vind evenementen, organisatoren en locaties bij jou in de buurt.",
  locale: "nl_NL",
} as const;

/** Primary navigation (Dutch). */
export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/agenda", label: "Agenda" },
  { href: "/projecten", label: "Projecten" },
  // "Locaties" is deliberately absent from both menus (footer included). The
  // pages themselves stay: /locaties and each location remain reachable from
  // events and projects, and stay in the sitemap.
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
