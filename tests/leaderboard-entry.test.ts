/**
 * File: tests/leaderboard-entry.test.ts
 * Purpose: Unit tests for the leaderboard's pure logic: ordering, which
 * scans qualify, and validation of stored records.
 */
import { describe, expect, it } from "vitest";
import {
  buildLeaderboardRecord,
  calculateRankValue,
  parseLeaderboardRecord,
  rankLeaderboardRecords,
  serializeLeaderboardRecord,
  type LeaderboardRecord,
} from "@/lib/leaderboard/leaderboard-entry";
import { assessWalletTrauma } from "@/lib/scanner/trauma-score";
import type {
  LosingPosition,
  WalletLossProfile,
  WalletScanResult,
} from "@/lib/scanner/types";

const WALLET_ADDRESS = "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o";

function buildLosingPosition(totalPnlUsd: number): LosingPosition {
  return {
    tokenMintAddress: `Mint${Math.abs(totalPnlUsd)}`,
    tokenSymbol: "TEST",
    tokenName: "Test token",
    investedUsd: Math.abs(totalPnlUsd) * 2,
    proceedsUsd: Math.abs(totalPnlUsd),
    totalPnlUsd,
    roiPercent: -50,
    isStillHolding: false,
    lastTradeAt: null,
  };
}

function buildDiagnosedScan(
  profileOverrides: Partial<WalletLossProfile> = {},
): WalletScanResult {
  const profile: WalletLossProfile = {
    walletAddress: WALLET_ADDRESS,
    realizedPnlUsd: -9_000,
    unrealizedPnlUsd: 0,
    totalPnlUsd: -9_000,
    investedUsd: 30_000,
    proceedsUsd: 21_000,
    closedPositionCount: 40,
    winningPositionCount: 12,
    losingPositionCount: 28,
    tokensTradedCount: 40,
    tradeCount: 160,
    wipeoutRatePercent: 20,
    openPositionsCostUsd: 0,
    openPositionsValueUsd: 0,
    firstTradeAt: null,
    lastTradeAt: null,
    averageHoldTimeSeconds: null,
    worstPositions: [buildLosingPosition(-4_000), buildLosingPosition(-2_500)],
    automatedWalletLabel: null,
    dataUpdatedAt: null,
    ...profileOverrides,
  };
  return {
    status: "diagnosed",
    profile,
    assessment: assessWalletTrauma(profile),
    scannedAt: "2026-11-17T00:00:00.000Z",
  };
}

describe("calculateRankValue", () => {
  it("orders by trauma score first", () => {
    // A lower score can never outrank a higher one, whatever the losses.
    expect(calculateRankValue(50, 0)).toBeGreaterThan(
      calculateRankValue(49, 900_000_000),
    );
  });

  it("breaks ties in favor of the larger combined loss", () => {
    expect(calculateRankValue(60, 25_000)).toBeGreaterThan(
      calculateRankValue(60, 24_999),
    );
  });

  it("keeps the tie-break below one point even for extreme losses", () => {
    expect(calculateRankValue(60, 5_000_000_000_000)).toBeLessThan(61);
    expect(calculateRankValue(60, -500)).toBe(60);
  });
});

describe("buildLeaderboardRecord", () => {
  it("builds a record from a diagnosed scan", () => {
    const scanResult = buildDiagnosedScan();
    const record = buildLeaderboardRecord(scanResult);
    expect(record).not.toBeNull();
    expect(record?.walletAddress).toBe(WALLET_ADDRESS);
    expect(record?.combinedLossUsd).toBe(6_500);
    expect(record?.netPnlUsd).toBe(-9_000);
    expect(record?.scannedAt).toBe("2026-11-17T00:00:00.000Z");
    if (scanResult.status === "diagnosed") {
      expect(record?.score).toBe(scanResult.assessment.score);
      expect(record?.tierKey).toBe(scanResult.assessment.tier.key);
    }
  });

  it("does not rank automated or institutional wallets", () => {
    expect(
      buildLeaderboardRecord(
        buildDiagnosedScan({ automatedWalletLabel: "Trading bot" }),
      ),
    ).toBeNull();
  });

  it("does not rank scans that produced no diagnosis", () => {
    expect(
      buildLeaderboardRecord({
        status: "insufficient_history",
        walletAddress: WALLET_ADDRESS,
        closedPositionCount: 2,
        minimumClosedPositions: 5,
      }),
    ).toBeNull();
    expect(
      buildLeaderboardRecord({
        status: "provider_unavailable",
        reason: "timeout",
      }),
    ).toBeNull();
  });
});

describe("stored record round trip", () => {
  const record: LeaderboardRecord = {
    walletAddress: WALLET_ADDRESS,
    score: 77,
    tierKey: "terminal_degeneracy",
    combinedLossUsd: 27_250,
    netPnlUsd: -24_600.62,
    scannedAt: "2026-11-17T00:00:00.000Z",
  };

  it("serializes and parses back to the same record", () => {
    expect(parseLeaderboardRecord(serializeLeaderboardRecord(record))).toEqual(
      record,
    );
  });

  it("rejects missing, malformed and out-of-range values", () => {
    expect(parseLeaderboardRecord(null)).toBeNull();
    expect(parseLeaderboardRecord(undefined)).toBeNull();
    expect(parseLeaderboardRecord("not json")).toBeNull();
    expect(parseLeaderboardRecord(JSON.stringify({ score: 10 }))).toBeNull();
    expect(
      parseLeaderboardRecord(JSON.stringify({ ...record, score: 140 })),
    ).toBeNull();
    expect(
      parseLeaderboardRecord(
        JSON.stringify({ ...record, tierKey: "made_up_tier" }),
      ),
    ).toBeNull();
  });
});

describe("rankLeaderboardRecords", () => {
  it("assigns consecutive ranks in the given order and resolves tiers", () => {
    const rankedEntries = rankLeaderboardRecords([
      {
        walletAddress: WALLET_ADDRESS,
        score: 80,
        tierKey: "terminal_degeneracy",
        combinedLossUsd: 10,
        netPnlUsd: -10,
        scannedAt: "2026-11-17T00:00:00.000Z",
      },
      {
        walletAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        score: 40,
        tierKey: "chronic_bagholder",
        combinedLossUsd: 5,
        netPnlUsd: 5,
        scannedAt: "2026-11-17T00:00:00.000Z",
      },
    ]);
    expect(rankedEntries.map((entry) => entry.rank)).toEqual([1, 2]);
    expect(rankedEntries[0].tier.name).toBe("Terminal Degeneracy");
    expect(rankedEntries[1].tier.name).toBe("Chronic Bagholder");
  });
});
