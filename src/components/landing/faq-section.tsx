/**
 * File: src/components/landing/faq-section.tsx
 * Purpose: Frequently asked questions. Uses native details/summary elements,
 * so the disclosure works without JavaScript and is keyboard accessible.
 */
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/lib/config/site-config";
import { MINIMUM_CLOSED_POSITIONS_FOR_DIAGNOSIS } from "@/lib/scanner/trauma-score";

interface FrequentlyAskedQuestion {
  question: string;
  answer: string;
}

const FREQUENTLY_ASKED_QUESTIONS: readonly FrequentlyAskedQuestion[] = [
  {
    question: "Is it safe to scan my wallet?",
    answer:
      "Yes. The scanner reads public on-chain trading history for the address you paste. It never asks you to connect a wallet, sign a message or approve a transaction. If a site using this name asks for any of those to run a scan, it is not this one.",
  },
  {
    question: "Can I scan a wallet that is not mine?",
    answer:
      "Yes. Any Solana address works, because the data is public. When the claims desk opens, only wallets verified by signature will be eligible for payouts.",
  },
  {
    question: "Does a high score mean I get paid?",
    answer:
      "No. Claims are not open, and when they are, airdrops will be discretionary and limited to holders. A trauma score is a measurement, not an entitlement.",
  },
  {
    question: "Why does my wallet say there is not enough history?",
    answer: `A wallet needs at least ${MINIMUM_CLOSED_POSITIONS_FOR_DIAGNOSIS} closed positions to be scored. Brand-new wallets, wallets that only hold and wallets that only receive transfers will not have enough.`,
  },
  {
    question: "My losses look smaller than I remember. Why?",
    answer:
      "The scan covers swaps in tradable tokens on Solana, valued in US dollars. Losses on other chains, on centralized exchanges, in perpetuals or from tokens transferred in from another wallet are not included.",
  },
  {
    question: "Is this a real ETF?",
    answer: `No. ${siteConfig.ticker} is a memecoin and the name is a joke about the state of the market. It is not an exchange-traded fund, a security or an investment product.`,
  },
];

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="border-t border-line"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div>
          <SectionHeading
            titleId="faq-title"
            label="Questions"
            title="Before you check in"
          />
        </div>

        <div className="flex flex-col">
          {FREQUENTLY_ASKED_QUESTIONS.map((frequentlyAskedQuestion) => (
            <details
              key={frequentlyAskedQuestion.question}
              className="group border-t border-line last:border-b"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-base font-medium text-ink transition-colors hover:text-accent">
                {frequentlyAskedQuestion.question}
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="max-w-2xl pb-6 text-sm leading-relaxed text-ink-soft">
                {frequentlyAskedQuestion.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
