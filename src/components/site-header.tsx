/**
 * File: src/components/site-header.tsx
 * Purpose: Top navigation shared by every page: brand mark, section links and
 * the primary action. The buy link only renders when NEXT_PUBLIC_BUY_URL is set.
 */
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { siteConfig } from "@/lib/config/site-config";

const NAVIGATION_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Methodology", href: "/#methodology" },
  { label: "The fund", href: "/#fund" },
  { label: "Roadmap", href: "/#roadmap" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <BrandMark />

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAVIGATION_LINKS.map((navigationLink) => (
            <Link
              key={navigationLink.href}
              href={navigationLink.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {navigationLink.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {siteConfig.buyUrl ? (
            <a
              href={siteConfig.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex"
            >
              Buy {siteConfig.ticker}
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </a>
          ) : null}
          <Link
            href="/#scanner"
            className="hidden items-center whitespace-nowrap rounded-md border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink sm:inline-flex"
          >
            Scan a wallet
          </Link>
        </div>
      </div>
    </header>
  );
}
