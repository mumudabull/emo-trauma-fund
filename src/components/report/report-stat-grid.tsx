/**
 * File: src/components/report/report-stat-grid.tsx
 * Purpose: Key figures from a wallet's trading history, shown as a grid of
 * labelled values beneath the score. Gains and losses are marked by sign as
 * well as color.
 */
import {
  formatHoldDuration,
  formatInteger,
  formatPercent,
  formatUsd,
} from "@/lib/format/format-values";
import type { WalletLossProfile } from "@/lib/scanner/types";

type StatTone = "neutral" | "loss" | "gain";

interface ReportStat {
  label: string;
  value: string;
  detail: string;
  tone: StatTone;
}

const TONE_CLASS_NAMES: Record<StatTone, string> = {
  neutral: "text-ink",
  loss: "text-loss",
  gain: "text-gain",
};

function resolvePnlTone(amountUsd: number): StatTone {
  if (amountUsd < 0) {
    return "loss";
  }
  if (amountUsd > 0) {
    return "gain";
  }
  return "neutral";
}

function buildReportStats(profile: WalletLossProfile): ReportStat[] {
  const lossRatePercent =
    profile.closedPositionCount > 0
      ? (profile.losingPositionCount / profile.closedPositionCount) * 100
      : 0;

  return [
    {
      label: "Net PnL",
      value: formatUsd(profile.totalPnlUsd, { showPositiveSign: true }),
      detail: "Realized plus unrealized",
      tone: resolvePnlTone(profile.totalPnlUsd),
    },
    {
      label: "Realized PnL",
      value: formatUsd(profile.realizedPnlUsd, { showPositiveSign: true }),
      detail: "From positions sold",
      tone: resolvePnlTone(profile.realizedPnlUsd),
    },
    {
      label: "Bags still held",
      value: formatUsd(profile.unrealizedPnlUsd, { showPositiveSign: true }),
      detail: `${formatUsd(profile.openPositionsCostUsd)} cost, now worth ${formatUsd(profile.openPositionsValueUsd)}`,
      tone: resolvePnlTone(profile.unrealizedPnlUsd),
    },
    {
      label: "Total invested",
      value: formatUsd(profile.investedUsd),
      detail: `${formatInteger(profile.tradeCount)} trades in ${formatInteger(profile.tokensTradedCount)} tokens`,
      tone: "neutral",
    },
    {
      label: "Loss rate",
      value: formatPercent(lossRatePercent),
      detail: `${formatInteger(profile.losingPositionCount)} of ${formatInteger(profile.closedPositionCount)} closed positions`,
      tone: "neutral",
    },
    {
      label: "Wipeouts",
      value: formatPercent(profile.wipeoutRatePercent),
      detail: "Positions that lost over half",
      tone: "neutral",
    },
    {
      label: "Winning positions",
      value: formatInteger(profile.winningPositionCount),
      detail: "Closed in profit",
      tone: "neutral",
    },
    {
      label: "Average hold",
      value:
        profile.averageHoldTimeSeconds === null
          ? "Unknown"
          : formatHoldDuration(profile.averageHoldTimeSeconds),
      detail: "From first buy to exit",
      tone: "neutral",
    },
  ];
}

interface ReportStatGridProps {
  profile: WalletLossProfile;
}

export function ReportStatGrid({ profile }: ReportStatGridProps) {
  return (
    <section aria-label="Trading history figures">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        {buildReportStats(profile).map((reportStat) => (
          <div
            key={reportStat.label}
            className="flex flex-col gap-1.5 bg-surface p-5"
          >
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {reportStat.label}
            </dt>
            <dd
              className={`font-display text-3xl leading-none tabular-nums ${TONE_CLASS_NAMES[reportStat.tone]}`}
            >
              {reportStat.value}
            </dd>
            <dd className="text-xs leading-snug text-ink-faint">
              {reportStat.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
