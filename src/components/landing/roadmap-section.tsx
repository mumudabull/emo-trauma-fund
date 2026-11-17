/**
 * File: src/components/landing/roadmap-section.tsx
 * Purpose: Product roadmap. Phase numbers reflect the real build order:
 * the loss scanner (shipped), the leaderboard (next) and the Telegram group
 * therapy bot (planned).
 */
import { SectionHeading } from "@/components/section-heading";
import { StatusPill, type StatusPillTone } from "@/components/status-pill";
import { siteConfig } from "@/lib/config/site-config";

interface RoadmapPhase {
  phaseNumber: string;
  title: string;
  statusLabel: string;
  statusTone: StatusPillTone;
  summary: string;
  deliverables: readonly string[];
}

const ROADMAP_PHASES: readonly RoadmapPhase[] = [
  {
    phaseNumber: "Phase 1",
    title: "Loss scanner",
    statusLabel: "Live",
    statusTone: "live",
    summary: "Measure the damage and make it shareable.",
    deliverables: [
      "Wallet scan for any Solana address",
      "Trauma score with a published methodology",
      "Report page with a share card for X",
      "Public JSON API for the same scan",
    ],
  },
  {
    phaseNumber: "Phase 2",
    title: "The critical list",
    statusLabel: "Next",
    statusTone: "next",
    summary: "Rank the damage and give people something to beat.",
    deliverables: [
      "Leaderboard of the highest trauma scores",
      "Share card for your rank on the board",
      "Wallet verification by signature",
      `Airdrops to top-scoring ${siteConfig.ticker} holders`,
    ],
  },
  {
    phaseNumber: "Phase 3",
    title: "Group therapy on Telegram",
    statusLabel: "Planned",
    statusTone: "planned",
    summary: "Somewhere to process it together.",
    deliverables: [
      "Telegram bot that scans a wallet in chat",
      "Rug and liquidation alerts posted as intake notices",
      "Weekly worst-trade leaderboard",
    ],
  },
];

export function RoadmapSection() {
  return (
    <section
      id="roadmap"
      aria-labelledby="roadmap-title"
      className="border-t border-line"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-20 sm:px-8">
        <div>
          <SectionHeading
            titleId="roadmap-title"
            label="Roadmap"
            title="Treatment plan"
          >
            Three phases, built in this order.
          </SectionHeading>
        </div>

        <ol className="flex flex-col">
          {ROADMAP_PHASES.map((roadmapPhase) => (
            <li
              key={roadmapPhase.phaseNumber}
              className="grid gap-6 border-t border-line py-8 last:border-b md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-10"
            >
              <div className="flex items-center gap-3 md:flex-col md:items-start">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
                  {roadmapPhase.phaseNumber}
                </span>
                <StatusPill tone={roadmapPhase.statusTone}>
                  {roadmapPhase.statusLabel}
                </StatusPill>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-display text-3xl leading-none text-ink">
                  {roadmapPhase.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-soft">
                  {roadmapPhase.summary}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5 text-sm leading-relaxed text-ink-soft">
                {roadmapPhase.deliverables.map((deliverable) => (
                  <li key={deliverable} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-[0.6rem] h-px w-3 shrink-0 bg-ink-faint"
                    />
                    {deliverable}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
