/**
 * File: src/components/report/trauma-score-panel.tsx
 * Purpose: The headline of a report: the 0 to 100 trauma score, the
 * diagnosis with its artwork, and a scale showing where the score falls
 * among the five diagnosis bands.
 */
import Image from "next/image";
import { TIER_ARTWORK } from "@/components/report/tier-artwork";
import { TRAUMA_TIERS } from "@/lib/scanner/trauma-score";
import type { TraumaAssessment, TraumaTierKey } from "@/lib/scanner/types";

/**
 * Band fills step from a faint to a strong tint of the loss color, so the
 * scale reads as increasing severity without relying on separate hues.
 */
const TIER_SEGMENT_CLASS_NAMES: Record<TraumaTierKey, string> = {
  clinically_fine: "bg-loss/10",
  mild_bag_fatigue: "bg-loss/25",
  chronic_bagholder: "bg-loss/45",
  acute_rug_trauma: "bg-loss/65",
  terminal_degeneracy: "bg-loss/90",
};

interface TraumaScorePanelProps {
  assessment: TraumaAssessment;
}

export function TraumaScorePanel({ assessment }: TraumaScorePanelProps) {
  const tierArtwork = TIER_ARTWORK[assessment.tier.key];

  return (
    <section
      aria-labelledby="trauma-score-title"
      className="flex min-w-0 flex-col gap-8 rounded-xl border border-line bg-surface p-6 sm:p-8"
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2
              id="trauma-score-title"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint"
            >
              Trauma score
            </h2>
            <p className="flex items-baseline gap-3">
              <span className="font-display text-[6.5rem] leading-[0.85] tabular-nums text-ink sm:text-[8.5rem]">
                {assessment.score}
              </span>
              <span className="font-mono text-sm text-ink-faint">
                out of 100
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              Diagnosis
            </p>
            <p className="font-display text-4xl leading-none text-ink sm:text-5xl">
              {assessment.tier.name}
            </p>
            <p className="max-w-md text-base leading-relaxed text-ink-soft">
              {assessment.tier.clinicalNote}
            </p>
          </div>
        </div>

        {/* The same picture appears on this wallet's share card. */}
        <Image
          src={tierArtwork.image}
          alt={tierArtwork.alternativeText}
          placeholder="blur"
          sizes="(min-width: 640px) 16rem, 100vw"
          className="h-auto w-full max-w-xs shrink-0 rounded-xl border border-line sm:w-56 lg:w-64"
        />
      </div>

      {/* Decorative for assistive tech: the score and diagnosis above already
          carry the same information as text. */}
      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="relative pt-3">
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            {TRAUMA_TIERS.map((tier) => (
              <div
                key={tier.key}
                className={TIER_SEGMENT_CLASS_NAMES[tier.key]}
                // Each band's width is proportional to the score range it covers.
                style={{ flexGrow: tier.maximumScore - tier.minimumScore + 1 }}
              />
            ))}
          </div>
          <div
            className="absolute top-0 h-8 w-0.5 -translate-x-1/2 rounded-full bg-ink"
            style={{ left: `${assessment.score}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[11px] tabular-nums text-ink-faint">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    </section>
  );
}
