/**
 * File: src/app/layout.tsx
 * Purpose: Root layout. Loads the self-hosted fonts, sets site-wide metadata
 * (title template, Open Graph and X card defaults) and wraps every page in
 * the shared header and footer.
 */
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/config/site-config";
import "./globals.css";

// Fonts are bundled from src/assets/fonts (SIL Open Font License) so builds
// never depend on a third-party font host.
const geistSans = localFont({
  src: [
    {
      path: "../assets/fonts/geist-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/geist-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/geist-sans-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "../assets/fonts/geist-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/geist-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

const instrumentSerif = localFont({
  src: [
    {
      path: "../assets/fonts/instrument-serif-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/instrument-serif-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.name} (${siteConfig.ticker})`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} (${siteConfig.ticker})`,
    description: siteConfig.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} (${siteConfig.ticker})`,
    description: siteConfig.description,
    // Attributes link previews on X to the project's account.
    site: siteConfig.xHandle,
    creator: siteConfig.xHandle,
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf8f9",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="main-content" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
