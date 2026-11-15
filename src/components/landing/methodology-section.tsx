/**
 * File: src/components/landing/methodology-section.tsx
 * Purpose: Publishes how the trauma score is calculated. The component table
 * and the tier bands are rendered straight from the scoring engine's own
 * definitions, so this page cannot disagree with the code that scores wallets.
 */
import { SectionHeading } from "@/components/section-heading";
import { formatUsd } from "@/lib/format/format-values";
import {
  MINIMUM_CLOSED_POSITIONS_FOR_DIAGNOSIS,
  TRAUMA_SCORE_COMPONENT_DEFINITIONS,
  TRAUMA_TIERS,
  type TraumaScoreComponentDefinition,
} from "@/lib/scanner/trauma-score";

/** Describes a component's scale in words, for example "$50 to $100,000". */
function describeScaleRange(
  definition: TraumaScoreComponentDefinition,
): string {
  if (definition.scale.kind === "logarithmic_usd") {
    return `${formatUsd(definition.scale.floorUsd)} to ${formatUsd(definition.scale.capUsd)}`;
  }
  return `${definition.scale.floorPercent}% to ${definition.scale.capPercent}%`;
}

export function MethodologySection() {
  return (
    <section
      id="methodology"
      aria-labelledby="methodology-title"
      className="border-t border-line"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <SectionHeading
            titleId="methodology-title"
            label="Methodology"
            title="How the score is built"
          >
            Five measurements, weighted to 100 points. Dollar losses are scored
            on a logarithmic scale, so the jump from $100 to $1,000 counts about
            as much as the jump from $10,000 to $100,000.
          </SectionHeading>
          <ul className="flex flex-col gap-3 text-sm leading-relaxed text-ink-soft">
            <li>
              Trading data comes from Solana Tracker and covers swaps in
              tradable tokens. All amounts are in US dollars.
            </li>
            <li>
              Positions where more tokens were sold than bought, such as tokens
              transferred in from another wallet, are excluded.
            </li>
            <li>
              A wallet needs at least {MINIMUM_CLOSED_POSITIONS_FOR_DIAGNOSIS}{" "}
              closed positions to receive a score.
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-8">
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Trauma score components, what each measures, its scoring range
                and its weight
              </caption>
              <thead>
                <tr className="border-b border-line font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  <th scope="col" className="px-6 py-3.5 font-medium">
                    Component
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-medium">
                    Scored from
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-right font-medium"
                  >
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {TRAUMA_SCORE_COMPONENT_DEFINITIONS.map((definition) => (
                  <tr key={definition.key} className="align-top">
                    <th scope="row" className="px-6 py-4 font-normal">
                      <p className="font-medium text-ink">{definition.label}</p>
                      <p className="mt-1 max-w-sm leading-relaxed text-ink-soft">
                        {definition.description}
                      </p>
                    </th>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs tabular-nums text-ink-soft">
                      {describeScaleRange(definition)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono tabular-nums text-ink">
                      {definition.weight}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Diagnosis bands
            </p>
            <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-5">
              {TRAUMA_TIERS.map((tier) => (
                <li
                  key={tier.key}
                  className="flex flex-col gap-1 bg-surface p-4"
                >
                  <span className="font-mono text-xs tabular-nums text-ink-faint">
                    {tier.minimumScore} to {tier.maximumScore}
                  </span>
                  <span className="text-sm font-medium leading-snug text-ink">
                    {tier.name}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
