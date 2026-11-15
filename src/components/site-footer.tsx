/**
 * File: src/components/site-footer.tsx
 * Purpose: Site footer: brand, optional token contract and social links, and
 * the disclaimer that makes clear $ETF is a memecoin parody and not an
 * exchange-traded fund or investment product.
 */
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { CopyTextButton } from "@/components/copy-text-button";
import { buildTokenExplorerUrl, siteConfig } from "@/lib/config/site-config";

interface FooterLink {
  label: string;
  href: string;
}

function collectFooterLinks(): FooterLink[] {
  const footerLinks: FooterLink[] = [];
  if (siteConfig.xUrl) {
    footerLinks.push({ label: "X", href: siteConfig.xUrl });
  }
  if (siteConfig.telegramUrl) {
    footerLinks.push({ label: "Telegram", href: siteConfig.telegramUrl });
  }
  if (siteConfig.buyUrl) {
    footerLinks.push({
      label: `Buy ${siteConfig.ticker}`,
      href: siteConfig.buyUrl,
    });
  }
  if (siteConfig.tokenMintAddress) {
    footerLinks.push({
      label: "Token on Solscan",
      href: buildTokenExplorerUrl(siteConfig.tokenMintAddress),
    });
  }
  return footerLinks;
}

export function SiteFooter() {
  const footerLinks = collectFooterLinks();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-3">
            <BrandMark />
            <p className="text-sm leading-relaxed text-ink-soft">
              {siteConfig.ticker} on {siteConfig.chainName}. A loss scanner for
              anyone the market has personally wronged.
            </p>
          </div>

          {footerLinks.length > 0 ? (
            <nav aria-label="Token and community links">
              <ul className="flex flex-wrap gap-x-6 gap-y-3">
                {footerLinks.map((footerLink) => (
                  <li key={footerLink.href}>
                    <a
                      href={footerLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
                    >
                      {footerLink.label}
                      <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>

        {siteConfig.tokenMintAddress ? (
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Contract address
              </p>
              <p className="mt-1 break-all font-mono text-sm text-ink">
                {siteConfig.tokenMintAddress}
              </p>
            </div>
            <CopyTextButton
              textToCopy={siteConfig.tokenMintAddress}
              label="Copy address"
              className="shrink-0"
            />
          </div>
        ) : null}

        <p className="max-w-3xl border-t border-line pt-6 text-xs leading-relaxed text-ink-faint">
          {siteConfig.ticker} is a memecoin with no intrinsic value and no
          expectation of financial return. Despite the ticker, it is not an
          exchange-traded fund, a security or an investment product. Trauma
          scores are entertainment based on public on-chain data. Nothing on
          this site is financial, medical or psychological advice.
        </p>
      </div>
    </footer>
  );
}
