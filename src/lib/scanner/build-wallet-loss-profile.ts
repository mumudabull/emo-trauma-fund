/**
 * File: src/lib/scanner/build-wallet-loss-profile.ts
 * Purpose: Adapter from validated Solana Tracker PnL V2 responses to the
 * provider-agnostic WalletLossProfile. Pure and synchronous so it can be
 * unit-tested against the provider's documented payloads.
 */
import type {
  WalletPosition,
  WalletPositionsResponse,
  WalletSummaryResponse,
} from "@/lib/providers/solana-tracker/schemas";
import type { LosingPosition, WalletLossProfile } from "./types";

/**
 * Provider identity types and tags that mark a wallet as automated or
 * institutional rather than a person trading.
 */
const AUTOMATED_WALLET_LABELS: Readonly<Record<string, string>> = {
  bot: "Trading bot",
  arbitrage: "Arbitrage bot",
  exchange: "Exchange wallet",
  pool: "Liquidity pool",
};

/**
 * The provider reports the ROI distribution of closed positions as labelled
 * buckets. The bucket for positions that lost more than half is labelled
 * "<-50%"; the match is tolerant of whitespace differences.
 */
function isWipeoutBucket(rangeLabel: string): boolean {
  return rangeLabel.replace(/\s+/g, "").startsWith("<-50");
}

function resolveAutomatedWalletLabel(
  summary: WalletSummaryResponse,
): string | null {
  if (summary.tags?.isArbitrage) {
    return AUTOMATED_WALLET_LABELS.arbitrage;
  }
  const identityLabels = [
    summary.identity?.type ?? null,
    ...(summary.identity?.tags ?? []),
  ];
  for (const identityLabel of identityLabels) {
    if (!identityLabel) {
      continue;
    }
    const automatedLabel = AUTOMATED_WALLET_LABELS[identityLabel.toLowerCase()];
    if (automatedLabel) {
      return automatedLabel;
    }
  }
  return null;
}

function toLosingPosition(position: WalletPosition): LosingPosition | null {
  const totalPnlUsd =
    position.pnl.total ??
    (position.pnl.realized ?? 0) + (position.pnl.unrealized ?? 0);

  // Only genuine losses belong in the list, whatever the provider returned.
  if (!(totalPnlUsd < 0)) {
    return null;
  }

  return {
    tokenMintAddress: position.token,
    tokenSymbol: position.meta?.symbol ?? null,
    tokenName: position.meta?.name ?? null,
    investedUsd: position.invested ?? 0,
    proceedsUsd: position.proceeds ?? 0,
    totalPnlUsd,
    roiPercent: position.roi,
    isStillHolding: (position.current?.balance ?? 0) > 0,
    lastTradeAt: position.timing?.lastTrade ?? null,
  };
}

/**
 * Builds the loss profile from the wallet summary and its losing positions.
 * `losingPositions` may be null when the provider has a summary but returned
 * no positions record; the profile then simply carries an empty list.
 */
export function buildWalletLossProfile(
  summary: WalletSummaryResponse,
  losingPositions: WalletPositionsResponse | null,
): WalletLossProfile {
  const realizedPnlUsd = summary.summary.pnl.realized ?? 0;
  const unrealizedPnlUsd = summary.summary.pnl.unrealized ?? 0;
  const totalPnlUsd =
    summary.summary.pnl.total ?? realizedPnlUsd + unrealizedPnlUsd;

  const closedPositionCount = summary.analysis?.tokens?.closed ?? 0;
  const wipeoutBucket = summary.analysis?.distribution?.find((bucket) =>
    isWipeoutBucket(bucket.range),
  );
  // Prefer the provider's own rate; fall back to count over closed positions.
  const wipeoutRatePercent =
    wipeoutBucket?.rate ??
    (wipeoutBucket?.count != null && closedPositionCount > 0
      ? (wipeoutBucket.count / closedPositionCount) * 100
      : 0);

  // Re-sort locally so "worst first" holds even if the provider's ordering
  // parameters change or are ignored.
  const worstPositions = (losingPositions?.positions ?? [])
    .map(toLosingPosition)
    .filter((position): position is LosingPosition => position !== null)
    .sort(
      (firstPosition, secondPosition) =>
        firstPosition.totalPnlUsd - secondPosition.totalPnlUsd,
    );

  return {
    walletAddress: summary.wallet,
    realizedPnlUsd,
    unrealizedPnlUsd,
    totalPnlUsd,
    investedUsd: summary.summary.invested ?? 0,
    proceedsUsd: summary.summary.proceeds ?? 0,
    closedPositionCount,
    winningPositionCount: summary.analysis?.tokens?.winning ?? 0,
    losingPositionCount: summary.analysis?.tokens?.losing ?? 0,
    tokensTradedCount: summary.summary.counts?.tokensTraded ?? 0,
    tradeCount: summary.summary.counts?.trades ?? 0,
    wipeoutRatePercent,
    openPositionsCostUsd: summary.summary.openPositions?.cost ?? 0,
    openPositionsValueUsd: summary.summary.openPositions?.value ?? 0,
    firstTradeAt: summary.summary.timing?.firstTrade ?? null,
    lastTradeAt: summary.summary.timing?.lastTrade ?? null,
    averageHoldTimeSeconds: summary.summary.timing?.avgHoldTimeSecs ?? null,
    worstPositions,
    automatedWalletLabel: resolveAutomatedWalletLabel(summary),
    dataUpdatedAt: summary.updatedAt,
  };
}
