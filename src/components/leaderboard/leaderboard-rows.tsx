/**
 * File: src/components/leaderboard/leaderboard-rows.tsx
 * Purpose: Presentational pieces of the leaderboard: the ranked list of
 * wallets, the "bed reserved" rows shown before the board has entries, and
 * the loading skeleton. Shared by the landing-page preview and the full
 * leaderboard page.
 */
import Link from "next/link";
import { buildReportPath } from "@/lib/config/site-config";
import { formatUsd } from "@/lib/format/format-values";
import type { LeaderboardEntry } from "@/lib/leaderboard/leaderboard-entry";
import { truncateWalletAddress } from "@/lib/solana/wallet-address";

/** Formats a rank as two digits ("01") so the column stays aligned. */
function formatRank(rank: number): string {
  return String(rank).padStart(2, "0");
}

const ROW_CLASS_NAME =
  "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,14rem)_4.5rem] sm:gap-6 sm:px-6";

interface LeaderboardListProps {
  entries: readonly LeaderboardEntry[];
}

export function LeaderboardList({ entries }: LeaderboardListProps) {
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {entries.map((entry) => (
        <li key={entry.walletAddress}>
          <Link
            href={buildReportPath(entry.walletAddress)}
            className={`${ROW_CLASS_NAME} group transition-colors hover:bg-paper`}
          >
            <span className="font-mono text-sm tabular-nums text-ink-faint">
              {formatRank(entry.rank)}
            </span>

            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-mono text-sm text-ink group-hover:text-accent">
                {truncateWalletAddress(entry.walletAddress, 5)}
              </span>
              <span className="truncate text-xs text-ink-soft">
                {entry.tier.name}
              </span>
            </span>

            <span className="hidden truncate text-right text-sm text-ink-soft sm:block">
              <span className="font-mono tabular-nums text-loss">
                {formatUsd(-entry.combinedLossUsd)}
              </span>{" "}
              in losing bags
            </span>

            <span className="text-right font-display text-4xl leading-none tabular-nums text-ink">
              <span className="sr-only">Trauma score </span>
              {entry.score}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

interface ReservedBedRowsProps {
  /** How many empty ranks to show. */
  rowCount: number;
}

/**
 * Empty ranks for a board with no entries yet. They show the shape of the
 * list without inventing wallets or scores.
 */
export function ReservedBedRows({ rowCount }: ReservedBedRowsProps) {
  return (
    <ol
      aria-label="Empty leaderboard positions"
      className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface"
    >
      {Array.from({ length: rowCount }, (_unused, rowIndex) => (
        <li key={rowIndex} className={ROW_CLASS_NAME}>
          <span className="font-mono text-sm tabular-nums text-ink-faint">
            {formatRank(rowIndex + 1)}
          </span>
          <span className="flex items-center gap-3 whitespace-nowrap text-sm text-ink-faint">
            <span
              aria-hidden="true"
              className="h-px w-10 shrink-0 border-t border-dashed border-line-strong sm:w-16"
            />
            Bed reserved
          </span>
          <span className="hidden sm:block" />
          <span
            aria-hidden="true"
            className="text-right font-display text-4xl leading-none text-line-strong"
          >
            ?
          </span>
        </li>
      ))}
    </ol>
  );
}

interface LeaderboardRowsSkeletonProps {
  rowCount: number;
}

/** Placeholder shown while the board streams in. */
export function LeaderboardRowsSkeleton({
  rowCount,
}: LeaderboardRowsSkeletonProps) {
  return (
    <div
      role="status"
      className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface"
    >
      <span className="sr-only">Loading the leaderboard.</span>
      {Array.from({ length: rowCount }, (_unused, rowIndex) => (
        <div key={rowIndex} aria-hidden="true" className={ROW_CLASS_NAME}>
          <div className="h-3 w-6 rounded bg-line motion-safe:animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-32 rounded bg-line motion-safe:animate-pulse" />
            <div className="h-2.5 w-24 rounded bg-line motion-safe:animate-pulse" />
          </div>
          <div className="hidden h-3 w-36 justify-self-end rounded bg-line motion-safe:animate-pulse sm:block" />
          <div className="h-8 w-10 justify-self-end rounded bg-line motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}
