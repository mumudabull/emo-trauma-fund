/**
 * File: src/components/landing/hero-section.tsx
 * Purpose: Landing-page hero. Leads with the brand line and the wallet scan
 * form beside the mascot art, followed by the fund fact strip: a parody of an
 * asset manager's product summary that also reports the real delivery status
 * of each feature.
 */
import { Eye } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import nurseTakeYourMedicine from "@/assets/art/nurse-take-your-medicine.jpg";
import { StatusPill } from "@/components/status-pill";
import { WalletScanForm } from "@/components/wallet-scan-form";
import { siteConfig } from "@/lib/config/site-config";

interface FundFact {
  term: string;
  detail: ReactNode;
}

const FUND_FACTS: readonly FundFact[] = [
  { term: "Ticker", detail: siteConfig.ticker },
  { term: "Chain", detail: siteConfig.chainName },
  { term: "Asset class", detail: "Emotional damage" },
  { term: "Benchmark", detail: "Your entry price" },
  { term: "Loss scanner", detail: <StatusPill tone="live">Live</StatusPill> },
  { term: "Share cards", detail: <StatusPill tone="live">Live</StatusPill> },
];

function FundFactStrip() {
  return (
    <aside aria-label="Fund fact sheet" className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {FUND_FACTS.map((fundFact) => (
          <div
            key={fundFact.term}
            className="flex flex-col gap-2 bg-surface px-5 py-4"
          >
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {fundFact.term}
            </dt>
            <dd className="text-sm text-ink">{fundFact.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs leading-relaxed text-ink-faint">
        Parody. Not an exchange-traded fund, and not investment advice.
      </p>
    </aside>
  );
}

export function HeroSection() {
  return (
    <section id="scanner" className="scroll-mt-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16">
          <div className="flex flex-col gap-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              {siteConfig.ticker} · Loss scanner for {siteConfig.chainName}
            </p>

            <h1 className="font-display text-[3.25rem] leading-[0.98] text-ink sm:text-7xl lg:text-[5.25rem]">
              Stop coping and{" "}
              <em className="italic text-accent">start healing.</em>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
              {siteConfig.tagline} Paste a Solana wallet. We review its trading
              history, total the damage and issue a trauma score with a card you
              can post.
            </p>

            <div className="max-w-xl">
              <WalletScanForm />
              <p className="flex items-center gap-2 text-sm text-ink-faint">
                <Eye aria-hidden="true" className="size-4 shrink-0" />
                Read-only. No wallet connection and no signature.
              </p>
            </div>
          </div>

          {/* Above the fold on every screen size, so it is fetched eagerly. */}
          <Image
            src={nurseTakeYourMedicine}
            alt="The Emotional Trauma Fund nurse holding out a green and white capsule, with the caption: take your medicine."
            placeholder="blur"
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 28rem, (min-width: 640px) 32rem, 100vw"
            className="mx-auto h-auto w-full max-w-lg rounded-2xl border border-line lg:max-w-none"
          />
        </div>

        <FundFactStrip />
      </div>
    </section>
  );
}
