/**
 * File: src/lib/scanner/trauma-score.ts
 * Purpose: The trauma score engine. A pure, deterministic function from a
 * WalletLossProfile to a 0 to 100 score, its weighted components and a tier.
 * The component definitions exported here also drive the methodology section
 * of the site, so published weights can never drift from the code.
 */
import { formatPercent, formatUsd } from "@/lib/format/format-values";
import type {
  TraumaAssessment,
  TraumaScoreComponent,
  TraumaScoreComponentKey,
  TraumaTier,
  WalletLossProfile,
} from "./types";

/** Wallets with fewer closed positions than this are not scored. */
export const MINIMUM_CLOSED_POSITIONS_FOR_DIAGNOSIS = 5;

/** How many of the worst losing positions are pulled and summed per scan. */
export const WORST_POSITIONS_SAMPLE_SIZE = 100;

type SeverityScale =
  | {
      /** Dollar losses: logarithmic between a floor and a cap. */
      kind: "logarithmic_usd";
      floorUsd: number;
      capUsd: number;
    }
  | {
      /** Rates: linear between two percentages. */
      kind: "linear_percent";
      floorPercent: number;
      capPercent: number;
    };

export interface TraumaScoreComponentDefinition {
  key: TraumaScoreComponentKey;
  label: string;
  /** Plain-language description shown in the methodology section. */
  description: string;
  /** Maximum points. The weights below sum to exactly 100. */
  weight: number;
  scale: SeverityScale;
}

/**
 * Scoring model.
 *
 * Dollar components use a logarithmic scale because losses span several
 * orders of magnitude: the step from $100 to $1,000 should matter about as
 * much as the step from $10,000 to $100,000. Below the floor a loss scores
 * zero; at or above the cap it scores the full weight.
 *
 * Rate components are linear between a floor that a typical profitable
 * trader sits under and a cap that only consistently losing wallets reach.
 */
export const TRAUMA_SCORE_COMPONENT_DEFINITIONS: readonly TraumaScoreComponentDefinition[] =
  [
    {
      key: "net_damage",
      label: "Net damage",
      description:
        "Realized plus unrealized PnL across everything the wallet has traded. Counts only when the total is negative.",
      weight: 30,
      scale: { kind: "logarithmic_usd", floorUsd: 50, capUsd: 100_000 },
    },
    {
      key: "losing_bags",
      label: "Losing bags",
      description: `Combined loss across the wallet's worst losing positions, up to ${WORST_POSITIONS_SAMPLE_SIZE} of them. Wins elsewhere do not cancel these out.`,
      weight: 25,
      scale: { kind: "logarithmic_usd", floorUsd: 100, capUsd: 250_000 },
    },
    {
      key: "deepest_wound",
      label: "Deepest wound",
      description: "The single worst position the wallet has ever taken.",
      weight: 15,
      scale: { kind: "logarithmic_usd", floorUsd: 25, capUsd: 25_000 },
    },
    {
      key: "loss_rate",
      label: "Loss rate",
      description: "Share of closed positions that ended in a loss.",
      weight: 15,
      scale: { kind: "linear_percent", floorPercent: 35, capPercent: 85 },
    },
    {
      key: "wipeouts",
      label: "Wipeouts",
      description:
        "Share of closed positions that lost more than half their value.",
      weight: 15,
      scale: { kind: "linear_percent", floorPercent: 0, capPercent: 35 },
    },
  ];

/** Score bands, lowest first. Bands are contiguous and cover 0 to 100. */
export const TRAUMA_TIERS: readonly TraumaTier[] = [
  {
    key: "clinically_fine",
    name: "Clinically Fine",
    minimumScore: 0,
    maximumScore: 14,
    clinicalNote:
      "No treatment required. The committee finds this slightly suspicious.",
  },
  {
    key: "mild_bag_fatigue",
    name: "Mild Bag Fatigue",
    minimumScore: 15,
    maximumScore: 34,
    clinicalNote: "Manageable. Avoid opening charts after midnight.",
  },
  {
    key: "chronic_bagholder",
    name: "Chronic Bagholder",
    minimumScore: 35,
    maximumScore: 54,
    clinicalNote:
      "A long-term condition. Symptoms include saying it is still early.",
  },
  {
    key: "acute_rug_trauma",
    name: "Acute Rug Trauma",
    minimumScore: 55,
    maximumScore: 74,
    clinicalNote: "Significant damage on file. Priority intake recommended.",
  },
  {
    key: "terminal_degeneracy",
    name: "Terminal Degeneracy",
    minimumScore: 75,
    maximumScore: 100,
    clinicalNote: "The fund has rarely reviewed a chart history like this one.",
  },
];

function clampToUnitInterval(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/** Maps a measured value onto 0 to 1 using the component's scale. */
export function calculateSeverity(
  measuredValue: number,
  scale: SeverityScale,
): number {
  if (scale.kind === "logarithmic_usd") {
    if (measuredValue <= scale.floorUsd) {
      return 0;
    }
    const position =
      (Math.log10(measuredValue) - Math.log10(scale.floorUsd)) /
      (Math.log10(scale.capUsd) - Math.log10(scale.floorUsd));
    return clampToUnitInterval(position);
  }
  const position =
    (measuredValue - scale.floorPercent) /
    (scale.capPercent - scale.floorPercent);
  return clampToUnitInterval(position);
}

/** Extracts the raw measured value for each component from the profile. */
function measureComponent(
  componentKey: TraumaScoreComponentKey,
  profile: WalletLossProfile,
): { measuredValue: number; measuredValueLabel: string } {
  switch (componentKey) {
    case "net_damage": {
      const netLossUsd = Math.max(0, -profile.totalPnlUsd);
      return {
        measuredValue: netLossUsd,
        measuredValueLabel:
          netLossUsd > 0 ? `${formatUsd(netLossUsd)} net loss` : "No net loss",
      };
    }
    case "losing_bags": {
      // Positions with a non-negative PnL are ignored defensively in case the
      // provider's "losing" filter ever includes break-even rows.
      const combinedLossUsd = profile.worstPositions.reduce(
        (runningTotal, position) =>
          runningTotal + Math.max(0, -position.totalPnlUsd),
        0,
      );
      return {
        measuredValue: combinedLossUsd,
        measuredValueLabel: `${formatUsd(combinedLossUsd)} across ${profile.worstPositions.length} ${profile.worstPositions.length === 1 ? "position" : "positions"}`,
      };
    }
    case "deepest_wound": {
      const largestSingleLossUsd = profile.worstPositions.reduce(
        (largestLoss, position) => Math.max(largestLoss, -position.totalPnlUsd),
        0,
      );
      return {
        measuredValue: largestSingleLossUsd,
        measuredValueLabel:
          largestSingleLossUsd > 0
            ? `${formatUsd(largestSingleLossUsd)} on one position`
            : "No losing position",
      };
    }
    case "loss_rate": {
      const lossRatePercent =
        profile.closedPositionCount > 0
          ? (profile.losingPositionCount / profile.closedPositionCount) * 100
          : 0;
      return {
        measuredValue: lossRatePercent,
        measuredValueLabel: `${formatPercent(lossRatePercent)} of closed positions`,
      };
    }
    case "wipeouts": {
      return {
        measuredValue: profile.wipeoutRatePercent,
        measuredValueLabel: `${formatPercent(profile.wipeoutRatePercent)} lost over half`,
      };
    }
  }
}

export function findTraumaTier(score: number): TraumaTier {
  const matchingTier = TRAUMA_TIERS.find(
    (tier) => score >= tier.minimumScore && score <= tier.maximumScore,
  );
  // Scores are clamped to 0..100 and the bands cover that range, so a miss is
  // only possible if the tier table is edited incorrectly.
  if (!matchingTier) {
    throw new Error(`No trauma tier covers score ${score}.`);
  }
  return matchingTier;
}

/** Scores a wallet. Pure: the same profile always yields the same result. */
export function assessWalletTrauma(
  profile: WalletLossProfile,
): TraumaAssessment {
  const components: TraumaScoreComponent[] =
    TRAUMA_SCORE_COMPONENT_DEFINITIONS.map((definition) => {
      const { measuredValue, measuredValueLabel } = measureComponent(
        definition.key,
        profile,
      );
      const normalizedSeverity = calculateSeverity(
        measuredValue,
        definition.scale,
      );
      return {
        key: definition.key,
        label: definition.label,
        weight: definition.weight,
        normalizedSeverity,
        points: normalizedSeverity * definition.weight,
        measuredValueLabel,
      };
    });

  const totalPoints = components.reduce(
    (runningTotal, component) => runningTotal + component.points,
    0,
  );
  const score = Math.min(100, Math.max(0, Math.round(totalPoints)));

  return {
    score,
    tier: findTraumaTier(score),
    components,
  };
}
