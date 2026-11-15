/**
 * File: src/lib/providers/solana-tracker/schemas.ts
 * Purpose: zod schemas for the Solana Tracker PnL V2 responses the scanner
 * consumes (wallet summary and wallet positions). Responses are validated at
 * the boundary so the rest of the app only handles known shapes.
 *
 * Reference: https://docs.solanatracker.io/guides/pnl-v2/wallet-analysis
 *
 * The schemas are deliberately tolerant: only the fields the scanner needs are
 * declared, unknown keys are ignored, and optional blocks may be null or
 * absent. A provider that adds fields must not break scans.
 */
import { z } from "zod";

/** A monetary or numeric field the provider may return as null or omit. */
const nullableNumber = z
  .number()
  .nullish()
  .transform((value) => value ?? null);

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

/** Realized / unrealized / total PnL block, in USD by default. */
const pnlBlockSchema = z.object({
  realized: nullableNumber,
  unrealized: nullableNumber,
  total: nullableNumber,
});

/** Wallet labels resolved by the provider (KOL, bot, exchange and so on). */
const identitySchema = z.object({
  name: nullableString,
  type: nullableString,
  tags: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
});

/** GET /v2/pnl/wallets/{wallet} */
export const walletSummaryResponseSchema = z.object({
  wallet: z.string(),
  identity: identitySchema.nullish(),
  summary: z.object({
    pnl: pnlBlockSchema,
    invested: nullableNumber,
    proceeds: nullableNumber,
    openPositions: z
      .object({
        cost: nullableNumber,
        value: nullableNumber,
      })
      .nullish(),
    counts: z
      .object({
        buys: nullableNumber,
        sells: nullableNumber,
        trades: nullableNumber,
        tokensTraded: nullableNumber,
      })
      .nullish(),
    timing: z
      .object({
        firstTrade: nullableNumber,
        lastTrade: nullableNumber,
        avgHoldTimeSecs: nullableNumber,
      })
      .nullish(),
  }),
  analysis: z
    .object({
      winRate: nullableNumber,
      tokens: z
        .object({
          closed: nullableNumber,
          winning: nullableNumber,
          losing: nullableNumber,
        })
        .nullish(),
      distribution: z
        .array(
          z.object({
            range: z.string(),
            count: nullableNumber,
            rate: nullableNumber,
          }),
        )
        .nullish(),
    })
    .nullish(),
  tags: z
    .object({
      isArbitrage: z.boolean().nullish(),
    })
    .nullish(),
  updatedAt: nullableString,
});

/** One token position row, shared by the positions and highlights endpoints. */
export const walletPositionSchema = z.object({
  token: z.string(),
  pnl: pnlBlockSchema,
  invested: nullableNumber,
  proceeds: nullableNumber,
  roi: nullableNumber,
  current: z
    .object({
      balance: nullableNumber,
      value: nullableNumber,
    })
    .nullish(),
  timing: z
    .object({
      lastTrade: nullableNumber,
    })
    .nullish(),
  meta: z
    .object({
      symbol: nullableString,
      name: nullableString,
    })
    .nullish(),
});

/** GET /v2/pnl/wallets/{wallet}/positions */
export const walletPositionsResponseSchema = z.object({
  wallet: z.string(),
  positions: z.array(walletPositionSchema),
  stats: z
    .object({
      losing: nullableNumber,
    })
    .nullish(),
});

export type WalletSummaryResponse = z.infer<typeof walletSummaryResponseSchema>;
export type WalletPosition = z.infer<typeof walletPositionSchema>;
export type WalletPositionsResponse = z.infer<
  typeof walletPositionsResponseSchema
>;
