import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ConsentProvider } from "@/components/consent/consent-context";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { site } from "@/lib/site";

// All-sans (design-system spec): a single grotesk for headings and body.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={hanken.variable}>
      <body className="flex min-h-dvh flex-col">
        <ConsentProvider>
          <a href="#main" className="skip-link">
            Naar de inhoud
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}
