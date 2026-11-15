/**
 * File: tests/build-wallet-loss-profile.test.ts
 * Purpose: Verifies that Solana Tracker PnL V2 payloads are validated and
 * mapped into a WalletLossProfile correctly. The summary fixture is the
 * example response from the provider's documentation; the positions fixture
 * follows the documented row shape with losing values.
 */
import { describe, expect, it } from "vitest";
import {
  walletPositionsResponseSchema,
  walletSummaryResponseSchema,
} from "@/lib/providers/solana-tracker/schemas";
import { buildWalletLossProfile } from "@/lib/scanner/build-wallet-loss-profile";
import walletPositionsFixture from "./fixtures/solana-tracker-wallet-positions.json";
import walletSummaryFixture from "./fixtures/solana-tracker-wallet-summary.json";

describe("Solana Tracker response schemas", () => {
  it("accepts the documented wallet summary example", () => {
    const parsedSummary =
      walletSummaryResponseSchema.safeParse(walletSummaryFixture);
    expect(parsedSummary.success).toBe(true);
  });

  it("accepts position rows with null and missing optional blocks", () => {
    const parsedPositions = walletPositionsResponseSchema.safeParse(
      walletPositionsFixture,
    );
    expect(parsedPositions.success).toBe(true);
  });

  it("rejects a summary without the pnl block", () => {
    const parsedSummary = walletSummaryResponseSchema.safeParse({
      wallet: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
      summary: { invested: 10 },
    });
    expect(parsedSummary.success).toBe(false);
  });

  it("tolerates a minimal summary where optional blocks are absent", () => {
    const parsedSummary = walletSummaryResponseSchema.parse({
      wallet: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
      summary: { pnl: { realized: null, unrealized: null, total: null } },
    });
    const profile = buildWalletLossProfile(parsedSummary, null);
    expect(profile.totalPnlUsd).toBe(0);
    expect(profile.closedPositionCount).toBe(0);
    expect(profile.worstPositions).toEqual([]);
    expect(profile.automatedWalletLabel).toBeNull();
  });
});

describe("buildWalletLossProfile", () => {
  const walletSummary = walletSummaryResponseSchema.parse(walletSummaryFixture);
  const walletPositions = walletPositionsResponseSchema.parse(
    walletPositionsFixture,
  );
  const profile = buildWalletLossProfile(walletSummary, walletPositions);

  it("maps the wallet-level totals", () => {
    expect(profile.walletAddress).toBe(
      "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    );
    expect(profile.realizedPnlUsd).toBe(10705447.32);
    expect(profile.unrealizedPnlUsd).toBe(1395.74);
    expect(profile.totalPnlUsd).toBe(10706843.06);
    expect(profile.investedUsd).toBe(49779099.94);
    expect(profile.closedPositionCount).toBe(78518);
    expect(profile.winningPositionCount).toBe(48029);
    expect(profile.losingPositionCount).toBe(30375);
    expect(profile.tradeCount).toBe(334803);
    expect(profile.averageHoldTimeSeconds).toBe(20391);
    expect(profile.dataUpdatedAt).toBe("2026-04-24T19:08:38.649Z");
  });

  it("reads the wipeout rate from the '<-50%' distribution bucket", () => {
    expect(profile.wipeoutRatePercent).toBe(1.42);
  });

  it("keeps only genuine losses and orders them worst first", () => {
    expect(profile.worstPositions).toHaveLength(2);
    expect(profile.worstPositions[0].tokenSymbol).toBe("gork");
    expect(profile.worstPositions[0].totalPnlUsd).toBe(-35871.5);
    expect(profile.worstPositions[0].isStillHolding).toBe(true);
    expect(profile.worstPositions[1].tokenSymbol).toBe("7");
    expect(profile.worstPositions[1].isStillHolding).toBe(false);
  });

  it("does not flag a KOL wallet as automated", () => {
    expect(profile.automatedWalletLabel).toBeNull();
  });

  it("flags bot, exchange and arbitrage wallets as automated", () => {
    const botSummary = walletSummaryResponseSchema.parse({
      ...walletSummaryFixture,
      identity: { type: "bot", tags: ["bot"] },
    });
    expect(buildWalletLossProfile(botSummary, null).automatedWalletLabel).toBe(
      "Trading bot",
    );

    const exchangeSummary = walletSummaryResponseSchema.parse({
      ...walletSummaryFixture,
      identity: { type: "kol", tags: ["kol", "Exchange"] },
    });
    expect(
      buildWalletLossProfile(exchangeSummary, null).automatedWalletLabel,
    ).toBe("Exchange wallet");

    const arbitrageSummary = walletSummaryResponseSchema.parse({
      ...walletSummaryFixture,
      identity: null,
      tags: { isArbitrage: true },
    });
    expect(
      buildWalletLossProfile(arbitrageSummary, null).automatedWalletLabel,
    ).toBe("Arbitrage bot");
  });

  it("derives the wipeout rate from counts when the provider omits the rate", () => {
    const summaryWithoutRate = walletSummaryResponseSchema.parse({
      wallet: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
      summary: { pnl: { realized: -500, unrealized: 0, total: -500 } },
      analysis: {
        tokens: { closed: 40, winning: 10, losing: 30 },
        distribution: [{ range: "< -50%", count: 10, rate: null }],
      },
    });
    expect(
      buildWalletLossProfile(summaryWithoutRate, null).wipeoutRatePercent,
    ).toBe(25);
  });
});
