/**
 * File: src/components/landing/hero-section.tsx
 * Purpose: Landing-page hero. States what the product does, hosts the wallet
 * scan form, and shows the fund fact sheet: a parody of an asset manager's
 * product summary that also reports the real delivery status of each feature.
 */
import { Eye } from "lucide-react";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/status-pill";
import { WalletScanForm } from "@/components/wallet-scan-form";
import { siteConfig } from "@/lib/config/site-config";

interface FactSheetRow {
  term: string;
  detail: ReactNode;
}

const FACT_SHEET_ROWS: readonly FactSheetRow[] = [
  { term: "Ticker", detail: siteConfig.ticker },
  { term: "Chain", detail: siteConfig.chainName },
  { term: "Asset class", detail: "Emotional damage" },
  { term: "Benchmark", detail: "Your entry price" },
  { term: "Inception", detail: "The first candle you chased" },
  { term: "Loss scanner", detail: <StatusPill tone="live">Live</StatusPill> },
  { term: "Claims desk", detail: <StatusPill tone="next">Next</StatusPill> },
  {
    term: "Group therapy",
    detail: <StatusPill tone="planned">Planned</StatusPill>,
  },
];

function FundFactSheet() {
  return (
    <aside
      aria-label="Fund fact sheet"
      className="rounded-xl border border-line bg-surface"
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-6 py-4">
        <h2 className="font-display text-2xl leading-none text-ink">
          Fund fact sheet
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          {siteConfig.ticker}
        </p>
      </div>
      <dl className="divide-y divide-line px-6">
        {FACT_SHEET_ROWS.map((factSheetRow) => (
          <div
            key={factSheetRow.term}
            className="flex items-center justify-between gap-6 py-3.5"
          >
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {factSheetRow.term}
            </dt>
            <dd className="text-right text-sm text-ink">
              {factSheetRow.detail}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-line px-6 py-4 text-xs leading-relaxed text-ink-faint">
        Parody. Not an exchange-traded fund, and not investment advice.
      </p>
    </aside>
  );
}

export function HeroSection() {
  return (
    <section id="scanner" className="scroll-mt-6">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-16">
        <div className="flex flex-col gap-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            {siteConfig.ticker} · Loss scanner for {siteConfig.chainName}
          </p>

          <h1 className="font-display text-[3.25rem] leading-[0.98] text-ink sm:text-7xl lg:text-[5.25rem]">
            The fund for everything the market{" "}
            <em className="italic text-ink-soft">did to you.</em>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            Paste a Solana wallet. We review its trading history, total the
            damage and issue a trauma score with a report you can share.
          </p>

          <div className="max-w-xl">
            <WalletScanForm />
            <p className="flex items-center gap-2 text-sm text-ink-faint">
              <Eye aria-hidden="true" className="size-4 shrink-0" />
              Read-only. No wallet connection and no signature.
            </p>
          </div>
        </div>

        <FundFactSheet />
      </div>
    </section>
  );
}
