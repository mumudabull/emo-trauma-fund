/**
 * File: src/components/brand-mark.tsx
 * Purpose: The site's wordmark: a typographic "ETF" monogram next to the fund
 * name. Built from text only so it stays sharp at every size and needs no
 * image asset.
 */
import Link from "next/link";
import { siteConfig } from "@/lib/config/site-config";

export function BrandMark() {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className="group inline-flex items-center gap-3"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-8 items-center rounded-[5px] border border-ink px-1.5 font-mono text-[11px] font-medium tracking-[0.14em] text-ink transition-colors group-hover:bg-ink group-hover:text-paper"
      >
        ETF
      </span>
      <span className="whitespace-nowrap font-display text-[1.35rem] leading-none text-ink">
        {siteConfig.name}
      </span>
    </Link>
  );
}
