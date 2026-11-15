/**
 * File: src/lib/config/server-config.ts
 * Purpose: Server-only configuration (data provider credentials and scan
 * limits), validated with zod. Read lazily through getServerConfig() so a
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
});

export interface ServerConfig {
  /** Undefined when the operator has not set a key yet. */
  solanaTrackerApiKey: string | undefined;
  solanaTrackerBaseUrl: string;
  scanRateLimitPerMinute: number;
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
  });

  if (!parsedEnvironment.success) {
    throw new Error(
      `Invalid server environment configuration: ${z.prettifyError(parsedEnvironment.error)}`,
    );
  }

  return {
    solanaTrackerApiKey: parsedEnvironment.data.SOLANA_TRACKER_API_KEY,
    solanaTrackerBaseUrl:
      parsedEnvironment.data.SOLANA_TRACKER_BASE_URL.replace(/\/$/, ""),
    scanRateLimitPerMinute: parsedEnvironment.data.SCAN_RATE_LIMIT_PER_MINUTE,
  };
}
