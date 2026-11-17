/**
 * File: src/components/landing/fund-section.tsx
 * Purpose: Describes the planned claims desk: who it pays, the anti-farming
 * rules and the public payout ledger. It makes no statement about how the
 * fund is financed. The section is labelled as the next release because
 * claims are not open yet.
 */
import {
  BookOpenCheck,
  CalendarDays,
  Info,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { siteConfig } from "@/lib/config/site-config";

interface ClaimsDeskPrinciple {
  title: string;
  description: string;
  icon: LucideIcon;
}

const CLAIMS_DESK_PRINCIPLES: readonly ClaimsDeskPrinciple[] = [
  {
    title: "Weekly claims",
    description: `Each week the fund sends discretionary airdrops to the ${siteConfig.ticker} holders with the highest trauma scores.`,
    icon: CalendarDays,
  },
  {
    title: "Built against farming",
    description:
      "Only losses from before a published snapshot date count, wallets must be verified by signature, and claims are capped per wallet.",
    icon: ShieldCheck,
  },
  {
    title: "Open books",
    description:
      "Every payout is posted to a public ledger, so anyone can check who was paid and how much.",
    icon: BookOpenCheck,
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
          {CLAIMS_DESK_PRINCIPLES.map((claimsDeskPrinciple) => (
            <li
              key={claimsDeskPrinciple.title}
              className="flex flex-col gap-4 border-t border-ink pt-6"
            >
              <claimsDeskPrinciple.icon
                aria-hidden="true"
                className="size-5 text-ink-soft"
                strokeWidth={1.5}
              />
              <h3 className="text-base font-medium text-ink">
                {claimsDeskPrinciple.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                {claimsDeskPrinciple.description}
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
