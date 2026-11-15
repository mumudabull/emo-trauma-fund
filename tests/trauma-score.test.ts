/**
 * File: tests/trauma-score.test.ts
 * Purpose: Unit tests for the trauma score engine: scale maths, component
 * weights, tier bands and end-to-end scoring of representative wallets.
 */
import { describe, expect, it } from "vitest";
import {
  assessWalletTrauma,
  calculateSeverity,
  findTraumaTier,
  TRAUMA_SCORE_COMPONENT_DEFINITIONS,
  TRAUMA_TIERS,
} from "@/lib/scanner/trauma-score";
import type { LosingPosition, WalletLossProfile } from "@/lib/scanner/types";

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

/** A wallet with no losses at all; tests override only what they exercise. */
function buildProfile(
  overrides: Partial<WalletLossProfile> = {},
): WalletLossProfile {
  return {
    walletAddress: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    realizedPnlUsd: 0,
    unrealizedPnlUsd: 0,
    totalPnlUsd: 0,
    investedUsd: 0,
    proceedsUsd: 0,
    closedPositionCount: 20,
    winningPositionCount: 20,
    losingPositionCount: 0,
    tokensTradedCount: 20,
    tradeCount: 60,
    wipeoutRatePercent: 0,
    openPositionsCostUsd: 0,
    openPositionsValueUsd: 0,
    firstTradeAt: null,
    lastTradeAt: null,
    averageHoldTimeSeconds: null,
    worstPositions: [],
    automatedWalletLabel: null,
    dataUpdatedAt: null,
    ...overrides,
  };
}

describe("scoring model definition", () => {
  it("has component weights that sum to exactly 100", () => {
    const totalWeight = TRAUMA_SCORE_COMPONENT_DEFINITIONS.reduce(
      (runningTotal, definition) => runningTotal + definition.weight,
      0,
    );
    expect(totalWeight).toBe(100);
  });

  it("has contiguous tier bands covering 0 to 100", () => {
    expect(TRAUMA_TIERS[0].minimumScore).toBe(0);
    expect(TRAUMA_TIERS[TRAUMA_TIERS.length - 1].maximumScore).toBe(100);
    for (let tierIndex = 1; tierIndex < TRAUMA_TIERS.length; tierIndex += 1) {
      expect(TRAUMA_TIERS[tierIndex].minimumScore).toBe(
        TRAUMA_TIERS[tierIndex - 1].maximumScore + 1,
      );
    }
  });

  it("assigns every integer score to exactly one tier", () => {
    for (let score = 0; score <= 100; score += 1) {
      const matchingTiers = TRAUMA_TIERS.filter(
        (tier) => score >= tier.minimumScore && score <= tier.maximumScore,
      );
      expect(matchingTiers).toHaveLength(1);
      expect(findTraumaTier(score)).toBe(matchingTiers[0]);
    }
  });
});

describe("calculateSeverity", () => {
  const usdScale = {
    kind: "logarithmic_usd",
    floorUsd: 50,
    capUsd: 100_000,
  } as const;
  const percentScale = {
    kind: "linear_percent",
    floorPercent: 35,
    capPercent: 85,
  } as const;

  it("returns 0 at or below the dollar floor", () => {
    expect(calculateSeverity(0, usdScale)).toBe(0);
    expect(calculateSeverity(50, usdScale)).toBe(0);
  });

  it("returns 1 at or above the dollar cap", () => {
    expect(calculateSeverity(100_000, usdScale)).toBe(1);
    expect(calculateSeverity(5_000_000, usdScale)).toBe(1);
  });

  it("is logarithmic between floor and cap", () => {
    // The geometric midpoint of the range maps to exactly one half.
    const geometricMidpoint = Math.sqrt(50 * 100_000);
    expect(calculateSeverity(geometricMidpoint, usdScale)).toBeCloseTo(0.5, 10);
  });

  it("increases monotonically with the loss", () => {
    const losses = [60, 100, 1_000, 10_000, 50_000, 99_999];
    const severities = losses.map((loss) => calculateSeverity(loss, usdScale));
    for (let index = 1; index < severities.length; index += 1) {
      expect(severities[index]).toBeGreaterThan(severities[index - 1]);
    }
  });

  it("is linear and clamped for percentage scales", () => {
    expect(calculateSeverity(10, percentScale)).toBe(0);
    expect(calculateSeverity(35, percentScale)).toBe(0);
    expect(calculateSeverity(60, percentScale)).toBeCloseTo(0.5, 10);
    expect(calculateSeverity(85, percentScale)).toBe(1);
    expect(calculateSeverity(100, percentScale)).toBe(1);
  });

  it("treats NaN as no severity", () => {
    expect(calculateSeverity(Number.NaN, percentScale)).toBe(0);
  });
});

describe("assessWalletTrauma", () => {
  it("scores a profitable wallet with no losing positions at 0", () => {
    const assessment = assessWalletTrauma(
      buildProfile({ totalPnlUsd: 250_000, realizedPnlUsd: 250_000 }),
    );
    expect(assessment.score).toBe(0);
    expect(assessment.tier.key).toBe("clinically_fine");
  });

  it("scores a wallet at every cap at 100", () => {
    const assessment = assessWalletTrauma(
      buildProfile({
        totalPnlUsd: -400_000,
        closedPositionCount: 100,
        winningPositionCount: 5,
        losingPositionCount: 95,
        wipeoutRatePercent: 60,
        worstPositions: [
          buildLosingPosition(-200_000),
          buildLosingPosition(-90_000),
        ],
      }),
    );
    expect(assessment.score).toBe(100);
    expect(assessment.tier.key).toBe("terminal_degeneracy");
    for (const component of assessment.components) {
      expect(component.points).toBeCloseTo(component.weight, 10);
    }
  });

  it("still registers damage for a net-profitable wallet with heavy losing bags", () => {
    const assessment = assessWalletTrauma(
      buildProfile({
        totalPnlUsd: 40_000,
        closedPositionCount: 100,
        winningPositionCount: 55,
        losingPositionCount: 45,
        wipeoutRatePercent: 10,
        worstPositions: [
          buildLosingPosition(-12_000),
          buildLosingPosition(-6_000),
        ],
      }),
    );
    const netDamage = assessment.components.find(
      (component) => component.key === "net_damage",
    );
    const losingBags = assessment.components.find(
      (component) => component.key === "losing_bags",
    );
    expect(netDamage?.points).toBe(0);
    expect(losingBags?.points).toBeGreaterThan(0);
    expect(assessment.score).toBeGreaterThan(0);
  });

  it("ranks a heavier loser above a lighter one", () => {
    const lighterLoser = assessWalletTrauma(
      buildProfile({
        totalPnlUsd: -800,
        closedPositionCount: 20,
        winningPositionCount: 9,
        losingPositionCount: 11,
        wipeoutRatePercent: 10,
        worstPositions: [buildLosingPosition(-400), buildLosingPosition(-250)],
      }),
    );
    const heavierLoser = assessWalletTrauma(
      buildProfile({
        totalPnlUsd: -45_000,
        closedPositionCount: 200,
        winningPositionCount: 50,
        losingPositionCount: 150,
        wipeoutRatePercent: 30,
        worstPositions: [
          buildLosingPosition(-15_000),
          buildLosingPosition(-9_000),
          buildLosingPosition(-4_000),
        ],
      }),
    );
    expect(heavierLoser.score).toBeGreaterThan(lighterLoser.score);
  });

  it("returns an integer score whose components sum to it before rounding", () => {
    const assessment = assessWalletTrauma(
      buildProfile({
        totalPnlUsd: -3_200,
        closedPositionCount: 60,
        winningPositionCount: 22,
        losingPositionCount: 38,
        wipeoutRatePercent: 18,
        worstPositions: [
          buildLosingPosition(-1_100),
          buildLosingPosition(-700),
        ],
      }),
    );
    const summedPoints = assessment.components.reduce(
      (runningTotal, component) => runningTotal + component.points,
      0,
    );
    expect(Number.isInteger(assessment.score)).toBe(true);
    expect(assessment.score).toBe(Math.round(summedPoints));
  });

  it("is deterministic", () => {
    const profile = buildProfile({
      totalPnlUsd: -9_000,
      losingPositionCount: 14,
      winningPositionCount: 6,
      wipeoutRatePercent: 22,
      worstPositions: [buildLosingPosition(-3_000)],
    });
    expect(assessWalletTrauma(profile)).toEqual(assessWalletTrauma(profile));
  });

  it("ignores non-losing rows in the worst positions list", () => {
    const assessment = assessWalletTrauma(
      buildProfile({ worstPositions: [buildLosingPosition(500)] }),
    );
    const losingBags = assessment.components.find(
      (component) => component.key === "losing_bags",
    );
    const deepestWound = assessment.components.find(
      (component) => component.key === "deepest_wound",
    );
    expect(losingBags?.points).toBe(0);
    expect(deepestWound?.points).toBe(0);
  });
});
