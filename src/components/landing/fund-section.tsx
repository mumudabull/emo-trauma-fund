/**
 * File: src/components/landing/fund-section.tsx
 * Purpose: Describes how the fund is financed and paid out: the trading fee,
 * its split between the claims fund and the buyback airdrop, and the
 * anti-farming rules. Percentages come from siteConfig.tradingFee. The claims
 * desk is labelled as the next release because claims are not open yet.
 */
import { Info, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { siteConfig } from "@/lib/config/site-config";

const { tradingFee, ticker } = siteConfig;

interface FeeAllocation {
  /** Share of every trade, in percent. */
  percent: number;
  title: string;
  description: string;
}

/** Where each part of the trading fee goes. The parts sum to the total fee. */
const FEE_ALLOCATIONS: readonly FeeAllocation[] = [
  {
    percent: tradingFee.fundPercent,
    title: "To the fund",
    description: `Goes to the fund wallet. Each week the fund pays discretionary claims to the ${ticker} holders with the highest trauma scores.`,
  },
  {
    percent: tradingFee.buybackPercent,
    title: "To buybacks",
    description: `Buys ${ticker} on the open market and airdrops it to holders.`,
  },
];

export function FundSection() {
  return (
    <section
      id="fund"
      aria-labelledby="fund-title"
      className="border-t border-line"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-20 sm:px-8">
        <div>
          <SectionHeading
            titleId="fund-title"
            label="The fund"
            title={`A ${tradingFee.totalPercent}% fee, split in two`}
            labelAccessory={<StatusPill tone="next">Next</StatusPill>}
          >
            Every {ticker} trade carries a {tradingFee.totalPercent}% fee. Half
            pays claims for the damage the scanner measures, and half buys{" "}
            {ticker} for holders. The fee is the only money the fund has.
          </SectionHeading>
        </div>

        <ul className="grid gap-6 md:grid-cols-3">
          {FEE_ALLOCATIONS.map((feeAllocation) => (
            <li
              key={feeAllocation.title}
              className="flex flex-col gap-4 border-t border-ink pt-6"
            >
              <p className="font-display text-6xl leading-none tabular-nums text-ink">
                {feeAllocation.percent}%
              </p>
              <h3 className="text-base font-medium text-ink">
                {feeAllocation.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                {feeAllocation.description}
              </p>
            </li>
          ))}

          <li className="flex flex-col gap-4 border-t border-ink pt-6">
            {/* Sized to sit on the same baseline rhythm as the percentages. */}
            <div className="flex h-[3.75rem] items-end">
              <ShieldCheck
                aria-hidden="true"
                className="size-9 text-ink-soft"
                strokeWidth={1.25}
              />
            </div>
            <h3 className="text-base font-medium text-ink">
              Built against farming
            </h3>
            <p className="text-sm leading-relaxed text-ink-soft">
              Only losses from before a published snapshot date count, wallets
              must be verified by signature, and claims are capped per wallet.
            </p>
          </li>
        </ul>

        <p className="flex max-w-3xl items-start gap-3 rounded-lg border border-line bg-surface p-4 text-sm leading-relaxed text-ink-soft">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-ink-faint"
          />
          Claims are not open yet. Claims and airdrops are discretionary, a high
          score does not entitle anyone to payment, and the rules above may
          change before launch.
        </p>
      </div>
    </section>
  );
}
