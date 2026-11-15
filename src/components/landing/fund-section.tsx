/**
 * File: src/components/landing/fund-section.tsx
 * Purpose: Describes the planned claims desk: how the fund is financed, how
 * payouts are intended to work and the anti-farming rules. Everything here is
 * labelled as planned and non-binding because claims are not open yet.
 */
import {
  CalendarDays,
  Coins,
  Info,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { siteConfig } from "@/lib/config/site-config";

interface FundPrinciple {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FUND_PRINCIPLES: readonly FundPrinciple[] = [
  {
    title: "Funded by trading fees",
    description: `Creator fees from ${siteConfig.ticker} trading are routed to the fund wallet. The fund has no other source of money.`,
    icon: Coins,
  },
  {
    title: "Weekly claims",
    description: `Each week the fund sends discretionary airdrops to the ${siteConfig.ticker} holders with the highest trauma scores.`,
    icon: CalendarDays,
  },
  {
    title: "Built against farming",
    description:
      "Only losses from before a published snapshot date count, wallets must be verified by signature, and payouts are capped per wallet.",
    icon: ShieldCheck,
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
            title="A claims desk for the damage"
            labelAccessory={<StatusPill tone="next">Next</StatusPill>}
          >
            The scanner measures the damage. The claims desk is the next
            release, and it is what turns a score into a payout.
          </SectionHeading>
        </div>

        <ul className="grid gap-6 md:grid-cols-3">
          {FUND_PRINCIPLES.map((fundPrinciple) => (
            <li
              key={fundPrinciple.title}
              className="flex flex-col gap-4 border-t border-ink pt-6"
            >
              <fundPrinciple.icon
                aria-hidden="true"
                className="size-5 text-ink-soft"
                strokeWidth={1.5}
              />
              <h3 className="text-base font-medium text-ink">
                {fundPrinciple.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                {fundPrinciple.description}
              </p>
            </li>
          ))}
        </ul>

        <p className="flex max-w-3xl items-start gap-3 rounded-lg border border-line bg-surface p-4 text-sm leading-relaxed text-ink-soft">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-ink-faint"
          />
          Claims are not open yet. Airdrops are discretionary, a high score does
          not entitle anyone to payment, and the rules above may change before
          launch.
        </p>
      </div>
    </section>
  );
}
