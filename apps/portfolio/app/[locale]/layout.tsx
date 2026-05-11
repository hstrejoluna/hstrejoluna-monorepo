import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { LiquidGlassFilters } from "@hstrejoluna/ui";
import { routing } from "../../i18n/routing";
import "../globals.css";
import "@hstrejoluna/ui/styles/liquid-glass.css";

import Footer from "../../components/fragments/Footer";
import CookieBanner from "../../components/fragments/CookieBanner";
import GoogleTagManager from "../../components/tracking/GoogleTagManager";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://hstrejoluna.com",
  ),
  title: "Héctor Trejo Luna | Senior Software Architect",
  description:
    "Cinematic Portfolio of a Senior Frontend Engineer specializing in Scalable Ecosystems.",
  openGraph: {
    type: "website",
    siteName: "Dark Kinetic",
    title: "Héctor Trejo Luna | Senior Software Architect",
    description:
      "Cinematic Portfolio of a Senior Frontend Engineer specializing in Scalable Ecosystems.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Héctor Trejo Luna | Senior Software Architect",
    description:
      "Cinematic Portfolio of a Senior Frontend Engineer specializing in Scalable Ecosystems.",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* Document-global SVG <defs> for the Liquid Glass primitive. */}
          {/* Mounted exactly once per locale layout (REQ-2 / ADR-5). */}
          <LiquidGlassFilters />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-ember focus:text-void focus:font-mono focus:font-bold focus:uppercase focus:outline-none focus:ring-2 focus:ring-ember"
          >
            Skip to main content
          </a>
          <header className="sr-only" aria-label="Site branding">
            <p>Dark Kinetic — Portfolio by Héctor Trejo Luna</p>
            <nav aria-label="Primary navigation">
              <ul>
                <li>
                  <a href="#main-content">Home</a>
                </li>
                <li>
                  <a href={`/${locale}/privacy`}>Privacy</a>
                </li>
                <li>
                  <a href={`/${locale}/cookies`}>Cookies</a>
                </li>
                <li>
                  <a href={`/${locale}/legal`}>Legal</a>
                </li>
              </ul>
            </nav>
          </header>
          <div className="relative min-h-screen flex flex-col">
            <main id="main-content" className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <CookieBanner />
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID || ""} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
