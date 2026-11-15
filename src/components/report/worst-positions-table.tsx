/**
 * File: src/components/report/worst-positions-table.tsx
 * Purpose: Table of a wallet's worst losing positions, most damaging first,
 * with a link to each token on the block explorer.
 */
import { ArrowUpRight } from "lucide-react";
import { buildTokenExplorerUrl } from "@/lib/config/site-config";
import { formatPercent, formatUsd } from "@/lib/format/format-values";
import type { LosingPosition } from "@/lib/scanner/types";
import { truncateWalletAddress } from "@/lib/solana/wallet-address";

/** How many positions the report lists. The score uses the full sample. */
const DISPLAYED_POSITION_COUNT = 8;

interface WorstPositionsTableProps {
  worstPositions: readonly LosingPosition[];
}

export function WorstPositionsTable({
  worstPositions,
}: WorstPositionsTableProps) {
  const displayedPositions = worstPositions.slice(0, DISPLAYED_POSITION_COUNT);

  return (
    <section
      aria-labelledby="worst-positions-title"
      className="flex min-w-0 flex-col gap-6 rounded-xl border border-line bg-surface p-6 sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="worst-positions-title"
          className="font-display text-3xl leading-none text-ink"
        >
          Deepest wounds
        </h2>
        <p className="text-sm text-ink-soft">
          The positions that did the most damage, worst first.
        </p>
      </div>

      {displayedPositions.length === 0 ? (
        <p className="text-sm text-ink-soft">
          No losing positions on record for this wallet.
        </p>
      ) : (
        // Only the table scrolls sideways on narrow screens, never the page.
        <div className="-mx-6 overflow-x-auto px-6 sm:-mx-8 sm:px-8">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Token
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Invested
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Returned
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  PnL
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  ROI
                </th>
                <th scope="col" className="py-3 pl-4 text-right font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {displayedPositions.map((position) => {
                // Token symbols and names come from the data provider and are
                // user-controlled on-chain metadata. React escapes them, and
                // they are truncated so a long name cannot break the layout.
                const tokenLabel =
                  position.tokenSymbol ??
                  truncateWalletAddress(position.tokenMintAddress);
                return (
                  <tr key={position.tokenMintAddress}>
                    <th scope="row" className="py-3.5 pr-4 font-normal">
                      <a
                        href={buildTokenExplorerUrl(position.tokenMintAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex max-w-[14rem] items-center gap-1.5"
                      >
                        <span className="truncate font-medium text-ink group-hover:text-accent">
                          {tokenLabel}
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-ink-faint"
                        />
                      </a>
                      {position.tokenName ? (
                        <p className="max-w-[14rem] truncate text-xs text-ink-faint">
                          {position.tokenName}
                        </p>
                      ) : null}
                    </th>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-ink-soft">
                      {formatUsd(position.investedUsd)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-ink-soft">
                      {formatUsd(position.proceedsUsd)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-loss">
                      {formatUsd(position.totalPnlUsd)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-ink-soft">
                      {position.roiPercent === null
                        ? "n/a"
                        : formatPercent(position.roiPercent)}
                    </td>
                    <td className="whitespace-nowrap py-3.5 pl-4 text-right text-xs text-ink-soft">
                      {position.isStillHolding ? "Still holding" : "Sold"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
