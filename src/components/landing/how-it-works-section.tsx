/**
 * File: src/components/landing/how-it-works-section.tsx
 * Purpose: Explains the scanner as the three steps a visitor actually goes
 * through: intake, assessment and report.
 */
import { Activity, ScanSearch, Share2, type LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

interface ProcessStep {
  stepNumber: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    stepNumber: "01",
    title: "Intake",
    description:
      "Paste any Solana wallet address. The scanner only reads public trading history, so it works for your wallet or anyone else's.",
    icon: ScanSearch,
  },
  {
    stepNumber: "02",
    title: "Assessment",
    description:
      "We total the net loss, add up the worst bags, find the single deepest wound and measure how often positions ended red.",
    icon: Activity,
  },
  {
    stepNumber: "03",
    title: "Report",
    description:
      "You get a trauma score from 0 to 100, a diagnosis and a report page with its own share card, ready to post.",
    icon: Share2,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="border-t border-line"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-20 sm:px-8">
        <div>
          <SectionHeading
            titleId="how-it-works-title"
            label="How it works"
            title="Three steps to a diagnosis"
          >
            No sign-up and no wallet connection. A scan takes a few seconds.
          </SectionHeading>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
          {PROCESS_STEPS.map((processStep) => (
            <li
              key={processStep.stepNumber}
              className="flex flex-col gap-5 bg-surface p-7"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ink-faint">
                  {processStep.stepNumber}
                </span>
                <processStep.icon
                  aria-hidden="true"
                  className="size-5 text-ink-soft"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="font-display text-3xl leading-none text-ink">
                {processStep.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                {processStep.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
