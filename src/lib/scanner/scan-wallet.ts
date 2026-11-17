/**
 * File: src/lib/scanner/scan-wallet.ts
 * Purpose: Orchestrates one wallet scan: fetch provider data, build the loss
 * profile, score it. This is the single entry point used by the report page,
 * the share-card image and the JSON API, so all three always agree.
 */
import "server-only";
import { cacheLife } from "next/cache";
import { after } from "next/server";
import { getServerConfig } from "@/lib/config/server-config";
import { buildLeaderboardRecord } from "@/lib/leaderboard/leaderboard-entry";
import { recordLeaderboardEntry } from "@/lib/leaderboard/leaderboard-store";
import {
  fetchWalletPnlSummary,
  fetchWorstLosingPositions,
  SolanaTrackerRequestError,
} from "@/lib/providers/solana-tracker/client";
import { buildWalletLossProfile } from "./build-wallet-loss-profile";
import {
  assessWalletTrauma,
  MINIMUM_CLOSED_POSITIONS_FOR_DIAGNOSIS,
  WORST_POSITIONS_SAMPLE_SIZE,
} from "./trauma-score";
import type { ProviderUnavailableReason, WalletScanResult } from "./types";

/**
 * Cache lifetime for a completed scan. Trading history moves slowly relative
 * to how often a report link is opened once it has been shared, so ten
 * minutes of freshness removes almost all repeat provider calls.
 */
const COMPLETED_SCAN_CACHE_LIFE = {
  stale: 300,
  revalidate: 600,
  expire: 3_600,
} as const;

/**
 * Cache lifetime for a failed scan. Failures are cached briefly on purpose:
 * when the provider is down or rate limiting, every viewer retrying at once
 * would otherwise multiply the load on it.
 */
const FAILED_SCAN_CACHE_LIFE = {
  stale: 30,
  revalidate: 30,
  expire: 60,
} as const;

function mapFailureToUnavailableReason(
  error: SolanaTrackerRequestError,
): ProviderUnavailableReason {
  switch (error.failureKind) {
    case "rate_limited":
      return "rate_limited";
    case "timeout":
      return "timeout";
    case "unauthorized":
    case "invalid_response":
    case "upstream_error":
      return "upstream_error";
  }
}

/**
 * The cached unit of work, keyed by wallet address.
 *
 * `use cache: remote` stores the result in the platform's shared cache where
 * one exists (so serverless instances share hits) and in process memory on a
 * single self-hosted server. The API key is read from the environment inside
 * the function rather than passed as an argument, because arguments become
 * part of the cache key and would be written to cache storage.
 */
async function loadCachedWalletScan(
  walletAddress: string,
): Promise<WalletScanResult> {
  "use cache: remote";

  const serverConfig = getServerConfig();
  if (!serverConfig.solanaTrackerApiKey) {
    cacheLife(FAILED_SCAN_CACHE_LIFE);
    return { status: "scanner_unconfigured" };
  }
  const clientOptions = {
    apiKey: serverConfig.solanaTrackerApiKey,
    baseUrl: serverConfig.solanaTrackerBaseUrl,
  };

  try {
    const walletSummary = await fetchWalletPnlSummary(
      walletAddress,
      clientOptions,
    );
    const closedPositionCount = walletSummary?.analysis?.tokens?.closed ?? 0;

    // The positions call is skipped for wallets that cannot be scored, which
    // halves provider usage for empty and brand-new wallets.
    if (
      !walletSummary ||
      closedPositionCount < MINIMUM_CLOSED_POSITIONS_FOR_DIAGNOSIS
    ) {
      cacheLife(COMPLETED_SCAN_CACHE_LIFE);
      return {
        status: "insufficient_history",
        walletAddress,
        closedPositionCount,
        minimumClosedPositions: MINIMUM_CLOSED_POSITIONS_FOR_DIAGNOSIS,
      };
    }

    const losingPositions = await fetchWorstLosingPositions(
      walletAddress,
      WORST_POSITIONS_SAMPLE_SIZE,
      clientOptions,
    );

    const profile = buildWalletLossProfile(walletSummary, losingPositions);
    const assessment = assessWalletTrauma(profile);

    cacheLife(COMPLETED_SCAN_CACHE_LIFE);
    return {
      status: "diagnosed",
      profile,
      assessment,
      scannedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof SolanaTrackerRequestError) {
      // Logged for the operator; the viewer only sees a neutral notice.
      console.error("[scan-wallet] provider request failed", {
        failureKind: error.failureKind,
        httpStatus: error.httpStatus,
        message: error.message,
      });
      cacheLife(FAILED_SCAN_CACHE_LIFE);
      return {
        status: "provider_unavailable",
        reason: mapFailureToUnavailableReason(error),
      };
    }
    throw error;
  }
}

/**
 * A scan counts as fresh for this long after it was computed. Results served
 * from the scan cache are older than this, so the leaderboard is written
 * about once per real scan instead of once per page view.
 */
const FRESH_SCAN_WINDOW_MILLISECONDS = 60_000;

/**
 * Queues a leaderboard write for a freshly computed, rankable scan. The
 * write runs after the response has been sent, so it never slows a report.
 */
function scheduleLeaderboardRecording(scanResult: WalletScanResult): void {
  const leaderboardRecord = buildLeaderboardRecord(scanResult);
  if (!leaderboardRecord) {
    return;
  }
  const scanAgeMilliseconds =
    Date.now() - Date.parse(leaderboardRecord.scannedAt);
  if (
    Number.isNaN(scanAgeMilliseconds) ||
    scanAgeMilliseconds > FRESH_SCAN_WINDOW_MILLISECONDS
  ) {
    return;
  }
  after(() => recordLeaderboardEntry(leaderboardRecord));
}

/**
 * Scans a wallet. `walletAddress` must already be validated with
 * parseSolanaWalletAddress; callers are also responsible for rate limiting,
 * because that depends on request headers, which cached code cannot read.
 *
 * Must be called at request time (after `connection()` in a Server
 * Component, or from a route handler), because it reads the clock to decide
 * whether the result is fresh enough to record on the leaderboard.
 */
export async function scanWallet(
  walletAddress: string,
): Promise<WalletScanResult> {
  // Checked outside the cached function so that adding the API key takes
  // effect immediately instead of after a cached "unconfigured" result expires.
  if (!getServerConfig().solanaTrackerApiKey) {
    return { status: "scanner_unconfigured" };
  }
  const scanResult = await loadCachedWalletScan(walletAddress);
  scheduleLeaderboardRecording(scanResult);
  return scanResult;
}
