/**
 * File: src/lib/config/server-config.ts
 * Purpose: Server-only configuration (data provider credentials, scan limits
 * and the optional leaderboard database), validated with zod. Read lazily through getServerConfig() so a
 * missing key surfaces as a clear "scanner not configured" state at request
 * time instead of failing the build.
 */
import "server-only";
import { z } from "zod";

/** Treats empty or whitespace-only environment values as unset. */
function emptyStringToUndefined(rawValue: unknown): unknown {
  if (typeof rawValue === "string" && rawValue.trim() === "") {
    return undefined;
  }
  return rawValue;
}

const serverEnvironmentSchema = z.object({
  SOLANA_TRACKER_API_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).optional(),
  ),
  SOLANA_TRACKER_BASE_URL: z.preprocess(
    emptyStringToUndefined,
    z.url().default("https://data.solanatracker.io"),
  ),
  SCAN_RATE_LIMIT_PER_MINUTE: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().min(1).max(600).default(12),
  ),
  // Leaderboard database (Upstash Redis REST). The Vercel Marketplace
  // integration injects the KV_* names; a database created directly at
  // Upstash uses the UPSTASH_* names. Either pair works.
  UPSTASH_REDIS_REST_URL: z.preprocess(
    emptyStringToUndefined,
    z.url().optional(),
  ),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).optional(),
  ),
  KV_REST_API_URL: z.preprocess(emptyStringToUndefined, z.url().optional()),
  KV_REST_API_TOKEN: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).optional(),
  ),
});

export interface ServerConfig {
  /** Undefined when the operator has not set a key yet. */
  solanaTrackerApiKey: string | undefined;
  solanaTrackerBaseUrl: string;
  scanRateLimitPerMinute: number;
  /** Null until a leaderboard database is connected. */
  leaderboardStore: { restUrl: string; restToken: string } | null;
}

/**
 * Parses the server environment. Throws a descriptive error when a value is
 * present but malformed (for example a non-numeric rate limit), because that
 * is an operator mistake that should be loud.
 */
export function getServerConfig(): ServerConfig {
  const parsedEnvironment = serverEnvironmentSchema.safeParse({
    SOLANA_TRACKER_API_KEY: process.env.SOLANA_TRACKER_API_KEY,
    SOLANA_TRACKER_BASE_URL: process.env.SOLANA_TRACKER_BASE_URL,
    SCAN_RATE_LIMIT_PER_MINUTE: process.env.SCAN_RATE_LIMIT_PER_MINUTE,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  });

  if (!parsedEnvironment.success) {
    throw new Error(
      `Invalid server environment configuration: ${z.prettifyError(parsedEnvironment.error)}`,
    );
  }

  const leaderboardRestUrl =
    parsedEnvironment.data.UPSTASH_REDIS_REST_URL ??
    parsedEnvironment.data.KV_REST_API_URL;
  const leaderboardRestToken =
    parsedEnvironment.data.UPSTASH_REDIS_REST_TOKEN ??
    parsedEnvironment.data.KV_REST_API_TOKEN;

  return {
    solanaTrackerApiKey: parsedEnvironment.data.SOLANA_TRACKER_API_KEY,
    solanaTrackerBaseUrl:
      parsedEnvironment.data.SOLANA_TRACKER_BASE_URL.replace(/\/$/, ""),
    scanRateLimitPerMinute: parsedEnvironment.data.SCAN_RATE_LIMIT_PER_MINUTE,
    // Both halves are required; a URL without a token (or the reverse) is
    // treated as not configured rather than as a broken connection.
    leaderboardStore:
      leaderboardRestUrl && leaderboardRestToken
        ? { restUrl: leaderboardRestUrl, restToken: leaderboardRestToken }
        : null,
  };
}
