/**
 * File: src/lib/scanner/types.ts
 * Purpose: Domain types for the loss scanner. These are provider-agnostic:
 * the Solana Tracker adapter maps into them, and a second chain or data
 * source only has to produce a WalletLossProfile to reuse scoring and UI.
 */

/** One losing token position, normalised to USD. */
export interface LosingPosition {
  tokenMintAddress: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  investedUsd: number;
  proceedsUsd: number;
  /** Realized plus unrealized PnL. Negative for a loss. */
  totalPnlUsd: number;
  /** Return on investment as a percentage, or null when the provider omits it. */
  roiPercent: number | null;
  /** True when the wallet still holds some of the token. */
  isStillHolding: boolean;
  /** Unix milliseconds of the last trade in this token, when known. */
  lastTradeAt: number | null;
}

/** Everything the scoring engine and report need to know about a wallet. */
export interface WalletLossProfile {
  walletAddress: string;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  /** Realized plus unrealized. */
  totalPnlUsd: number;
  investedUsd: number;
  proceedsUsd: number;
  closedPositionCount: number;
  winningPositionCount: number;
  losingPositionCount: number;
  tokensTradedCount: number;
  tradeCount: number;
  /** Share of closed positions that lost more than half their value, 0 to 100. */
  wipeoutRatePercent: number;
  openPositionsCostUsd: number;
  openPositionsValueUsd: number;
  /** Unix milliseconds. */
  firstTradeAt: number | null;
  /** Unix milliseconds. */
  lastTradeAt: number | null;
  averageHoldTimeSeconds: number | null;
  /** Worst losing positions, most negative first. */
  worstPositions: LosingPosition[];
  /**
   * Set when the data provider labels the wallet as automated or
   * institutional (bot, arbitrage, exchange, liquidity pool). Such wallets
   * still get a score, but are flagged as not eligible for claims.
   */
  automatedWalletLabel: string | null;
  /** ISO 8601 timestamp of the provider's last refresh for this wallet. */
  dataUpdatedAt: string | null;
}

export type TraumaScoreComponentKey =
  "net_damage" | "losing_bags" | "deepest_wound" | "loss_rate" | "wipeouts";

/** One weighted input to the trauma score, with its contribution. */
export interface TraumaScoreComponent {
  key: TraumaScoreComponentKey;
  label: string;
  /** Maximum points this component can contribute. All weights sum to 100. */
  weight: number;
  /** Severity on a 0 to 1 scale before weighting. */
  normalizedSeverity: number;
  /** weight multiplied by normalizedSeverity. */
  points: number;
  /** The measured value behind the severity, formatted for display. */
  measuredValueLabel: string;
}

export type TraumaTierKey =
  | "clinically_fine"
  | "mild_bag_fatigue"
  | "chronic_bagholder"
  | "acute_rug_trauma"
  | "terminal_degeneracy";

export interface TraumaTier {
  key: TraumaTierKey;
  name: string;
  /** Inclusive lower bound of the score band. */
  minimumScore: number;
  /** Inclusive upper bound of the score band. */
  maximumScore: number;
  clinicalNote: string;
}

export interface TraumaAssessment {
  /** Integer from 0 to 100. */
  score: number;
  tier: TraumaTier;
  components: TraumaScoreComponent[];
}

export type ProviderUnavailableReason =
  "rate_limited" | "timeout" | "upstream_error";

/** Every outcome a scan can have. The UI and API switch on `status`. */
export type WalletScanResult =
  | {
      status: "diagnosed";
      profile: WalletLossProfile;
      assessment: TraumaAssessment;
      /** ISO 8601 timestamp of when this scan was computed. */
      scannedAt: string;
    }
  | {
      status: "insufficient_history";
      walletAddress: string;
      closedPositionCount: number;
      minimumClosedPositions: number;
    }
  | { status: "scanner_unconfigured" }
  | { status: "provider_unavailable"; reason: ProviderUnavailableReason };
