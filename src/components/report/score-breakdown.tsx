/**
 * File: src/components/report/score-breakdown.tsx
 * Purpose: Shows how a wallet's trauma score was reached: each of the five
 * weighted components, the measurement behind it and the points it scored.
 */
import type { TraumaAssessment } from "@/lib/scanner/types";

interface ScoreBreakdownProps {
  assessment: TraumaAssessment;
}

function formatPoints(points: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(points);
}

export function ScoreBreakdown({ assessment }: ScoreBreakdownProps) {
  return (
    <section
      aria-labelledby="score-breakdown-title"
      className="flex min-w-0 flex-col gap-6 rounded-xl border border-line bg-surface p-6 sm:p-8"
    >
      <h2
        id="score-breakdown-title"
        className="font-display text-3xl leading-none text-ink"
      >
        How the score adds up
      </h2>

      <ul className="flex flex-col gap-5">
        {assessment.components.map((component) => (
          <li key={component.key} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-medium text-ink">{component.label}</p>
              <p className="shrink-0 font-mono text-xs tabular-nums text-ink-soft">
                {formatPoints(component.points)}
                <span className="text-ink-faint"> / {component.weight}</span>
              </p>
            </div>
            <div
              role="meter"
              aria-label={`${component.label} points`}
              aria-valuemin={0}
              aria-valuemax={component.weight}
              aria-valuenow={Number(component.points.toFixed(1))}
              className="h-1.5 overflow-hidden rounded-full bg-line"
            >
              <div
                className="h-full rounded-full bg-ink"
                style={{ width: `${component.normalizedSeverity * 100}%` }}
              />
            </div>
            <p className="text-xs text-ink-faint">
              {component.measuredValueLabel}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
