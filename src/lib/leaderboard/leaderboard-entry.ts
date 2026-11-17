/**
 * File: src/lib/leaderboard/leaderboard-entry.ts
 * Purpose: The leaderboard's data model and its pure logic: what is stored
 * for each scanned wallet, how entries are ordered, and how stored records
 * are validated when read back. No I/O happens here, so everything is unit
 * tested without a database.
 */
import { z } from "zod";
import { TRAUMA_TIERS } from "@/lib/scanner/trauma-score";
import type { TraumaTier, WalletScanResult } from "@/lib/scanner/types";

/** Largest loss, in whole dollars, that still affects tie-breaking. */
const TIE_BREAK_LOSS_CAP_USD = 999_999_999;

/** Divisor that keeps the tie-break strictly below one trauma point. */
const TIE_BREAK_DIVISOR = 1_000_000_000;

const tierKeySchema = z.enum([
  "clinically_fine",
  "mild_bag_fatigue",
  "chronic_bagholder",
  "acute_rug_trauma",
  "terminal_degeneracy",
]);

/** What is stored per wallet. Kept small: the report page has the detail. */
export const leaderboardRecordSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  score: z.number().int().min(0).max(100),
  tierKey: tierKeySchema,
  /** Combined loss across the wallet's worst losing positions, in USD. */
  combinedLossUsd: z.number().min(0),
  /** Realized plus unrealized PnL, in USD. Negative for a net loss. */
  netPnlUsd: z.number(),
  /** ISO 8601 timestamp of the scan that produced this entry. */
  scannedAt: z.string(),
});

export type LeaderboardRecord = z.infer<typeof leaderboardRecordSchema>;

/** A record with its position on the board and its resolved tier. */
export interface LeaderboardEntry extends LeaderboardRecord {
  /** 1-based position. */
  rank: number;
  tier: TraumaTier;
}

/** Every state the leaderboard can be in. The UI and API switch on `status`. */
export type LeaderboardSnapshot =
  | {
      status: "live";
      entries: LeaderboardEntry[];
      /** Wallets currently ranked, which can exceed the entries returned. */
      rankedWalletCount: number;
    }
  /** No database is connected to this deployment yet. */
  | { status: "not_configured" }
  /** A database is connected but could not be read right now. */
  | { status: "unavailable" };

/**
 * The value entries are sorted by, highest first.
 *
 * The integer part is the trauma score. The fractional part breaks ties
 * between equal scores in favor of the larger combined loss, and is always
 * below 1 so it can never lift a wallet above a higher score.
 */
export function calculateRankValue(
  score: number,
  combinedLossUsd: number,
): number {
  const cappedLossUsd = Math.min(
    Math.max(0, Math.floor(combinedLossUsd)),
    TIE_BREAK_LOSS_CAP_USD,
  );
  return score + cappedLossUsd / TIE_BREAK_DIVISOR;
}

/**
 * Builds the record to store for a scan, or null when the scan must not be
 * ranked: only diagnosed wallets qualify, and wallets the data provider
 * labels as bots, exchanges or pools are left out so the board stays about
 * people.
 */
export function buildLeaderboardRecord(
  scanResult: WalletScanResult,
): LeaderboardRecord | null {
  if (scanResult.status !== "diagnosed") {
    return null;
  }
  if (scanResult.profile.automatedWalletLabel !== null) {
    return null;
  }

  const combinedLossUsd = scanResult.profile.worstPositions.reduce(
    (runningTotal, position) =>
      runningTotal + Math.max(0, -position.totalPnlUsd),
    0,
  );

  return {
    walletAddress: scanResult.profile.walletAddress,
    score: scanResult.assessment.score,
    tierKey: scanResult.assessment.tier.key,
    combinedLossUsd,
    netPnlUsd: scanResult.profile.totalPnlUsd,
    scannedAt: scanResult.scannedAt,
  };
}

export function serializeLeaderboardRecord(record: LeaderboardRecord): string {
  return JSON.stringify(record);
}

/**
 * Parses a stored record. Returns null for missing, malformed or outdated
 * values, so one bad row can never break the whole board.
 */
export function parseLeaderboardRecord(
  storedValue: unknown,
): LeaderboardRecord | null {
  if (typeof storedValue !== "string") {
    return null;
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(storedValue);
  } catch {
    return null;
  }
  const parsedRecord = leaderboardRecordSchema.safeParse(parsedJson);
  return parsedRecord.success ? parsedRecord.data : null;
}

/**
 * Turns stored records, already in board order, into ranked entries.
 * Records whose tier no longer exists are skipped and do not consume a rank.
 */
export function rankLeaderboardRecords(
  orderedRecords: readonly LeaderboardRecord[],
): LeaderboardEntry[] {
  const rankedEntries: LeaderboardEntry[] = [];
  for (const record of orderedRecords) {
    const tier = TRAUMA_TIERS.find(
      (candidateTier) => candidateTier.key === record.tierKey,
    );
    if (!tier) {
      continue;
    }
    rankedEntries.push({ ...record, rank: rankedEntries.length + 1, tier });
  }
  return rankedEntries;
}
