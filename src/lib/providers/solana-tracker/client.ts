/**
 * File: src/lib/providers/solana-tracker/client.ts
 * Purpose: Server-side HTTP client for the Solana Tracker PnL V2 API. Owns
 * authentication, timeouts, a single bounded retry for transient failures,
 * and response validation. Nothing outside this folder talks to the provider.
 */
import "server-only";
import type { z } from "zod";
import {
  walletPositionsResponseSchema,
  walletSummaryResponseSchema,
  type WalletPositionsResponse,
  type WalletSummaryResponse,
} from "./schemas";

/** Upper bound for one provider call before the request is aborted. */
const REQUEST_TIMEOUT_MILLISECONDS = 12_000;

/** Pause before the single retry of a transient failure. */
const RETRY_DELAY_MILLISECONDS = 400;

/** Gateway-style statuses that are worth one retry. */
const RETRYABLE_HTTP_STATUSES = new Set([500, 502, 503, 504]);

export type SolanaTrackerFailureKind =
  | "rate_limited"
  | "unauthorized"
  | "timeout"
  | "upstream_error"
  | "invalid_response";

/** Typed failure so callers can map provider problems to user-facing states. */
export class SolanaTrackerRequestError extends Error {
  readonly failureKind: SolanaTrackerFailureKind;
  readonly httpStatus: number | null;

  constructor(
    failureKind: SolanaTrackerFailureKind,
    message: string,
    httpStatus: number | null = null,
  ) {
    super(message);
    this.name = "SolanaTrackerRequestError";
    this.failureKind = failureKind;
    this.httpStatus = httpStatus;
  }
}

export interface SolanaTrackerClientOptions {
  apiKey: string;
  baseUrl: string;
}

function waitMilliseconds(durationMilliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMilliseconds));
}

function isAbortOrTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

/**
 * Performs one authenticated GET and validates the JSON body.
 *
 * Returns null for HTTP 404, which the provider uses for wallets it has no
 * PnL record for. Every other non-success outcome throws a
 * SolanaTrackerRequestError.
 *
 * Retry policy: exactly one retry, and only for network errors, timeouts and
 * 5xx gateway statuses. 429 is never retried here, because retrying a rate
 * limit immediately only spends more quota.
 */
async function requestProviderJson<ResponseSchema extends z.ZodType>(
  requestUrl: URL,
  responseSchema: ResponseSchema,
  clientOptions: SolanaTrackerClientOptions,
): Promise<z.infer<ResponseSchema> | null> {
  const maximumAttempts = 2;
  let lastFailure: SolanaTrackerRequestError | null = null;

  for (
    let attemptNumber = 1;
    attemptNumber <= maximumAttempts;
    attemptNumber += 1
  ) {
    if (attemptNumber > 1) {
      await waitMilliseconds(RETRY_DELAY_MILLISECONDS);
    }

    let providerResponse: Response;
    try {
      providerResponse = await fetch(requestUrl, {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": clientOptions.apiKey,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
      });
    } catch (error) {
      lastFailure = isAbortOrTimeoutError(error)
        ? new SolanaTrackerRequestError(
            "timeout",
            `Solana Tracker did not respond within ${REQUEST_TIMEOUT_MILLISECONDS} ms.`,
          )
        : new SolanaTrackerRequestError(
            "upstream_error",
            "Network error while contacting Solana Tracker.",
          );
      continue;
    }

    if (providerResponse.status === 404) {
      return null;
    }
    if (providerResponse.status === 429) {
      throw new SolanaTrackerRequestError(
        "rate_limited",
        "Solana Tracker rate limit or monthly quota reached.",
        429,
      );
    }
    if (providerResponse.status === 401 || providerResponse.status === 403) {
      throw new SolanaTrackerRequestError(
        "unauthorized",
        "Solana Tracker rejected the API key.",
        providerResponse.status,
      );
    }
    if (RETRYABLE_HTTP_STATUSES.has(providerResponse.status)) {
      lastFailure = new SolanaTrackerRequestError(
        "upstream_error",
        `Solana Tracker returned HTTP ${providerResponse.status}.`,
        providerResponse.status,
      );
      continue;
    }
    if (!providerResponse.ok) {
      throw new SolanaTrackerRequestError(
        "upstream_error",
        `Solana Tracker returned HTTP ${providerResponse.status}.`,
        providerResponse.status,
      );
    }

    let responseBody: unknown;
    try {
      responseBody = await providerResponse.json();
    } catch {
      throw new SolanaTrackerRequestError(
        "invalid_response",
        "Solana Tracker returned a body that is not valid JSON.",
        providerResponse.status,
      );
    }

    const parsedBody = responseSchema.safeParse(responseBody);
    if (!parsedBody.success) {
      throw new SolanaTrackerRequestError(
        "invalid_response",
        `Solana Tracker response did not match the expected shape for ${requestUrl.pathname}.`,
        providerResponse.status,
      );
    }
    return parsedBody.data;
  }

  throw (
    lastFailure ??
    new SolanaTrackerRequestError(
      "upstream_error",
      "Solana Tracker request failed.",
    )
  );
}

/**
 * Wallet-level PnL summary: net realized and unrealized PnL, invested and
 * proceeds totals, win/loss counts and the ROI distribution.
 */
export async function fetchWalletPnlSummary(
  walletAddress: string,
  clientOptions: SolanaTrackerClientOptions,
): Promise<WalletSummaryResponse | null> {
  const requestUrl = new URL(
    `/v2/pnl/wallets/${encodeURIComponent(walletAddress)}`,
    clientOptions.baseUrl,
  );
  // "strict" excludes positions where more tokens were sold than bought
  // (tokens transferred in), which would otherwise distort cost basis.
  requestUrl.searchParams.set("pnlMode", "strict");
  return requestProviderJson(
    requestUrl,
    walletSummaryResponseSchema,
    clientOptions,
  );
}

/**
 * The wallet's losing positions ordered worst first, capped at `limit`
 * (the provider allows 1 to 200 per page).
 */
export async function fetchWorstLosingPositions(
  walletAddress: string,
  limit: number,
  clientOptions: SolanaTrackerClientOptions,
): Promise<WalletPositionsResponse | null> {
  const requestUrl = new URL(
    `/v2/pnl/wallets/${encodeURIComponent(walletAddress)}/positions`,
    clientOptions.baseUrl,
  );
  requestUrl.searchParams.set("pnlMode", "strict");
  requestUrl.searchParams.set("filter", "losing");
  requestUrl.searchParams.set("sort", "pnl");
  requestUrl.searchParams.set("direction", "asc");
  requestUrl.searchParams.set("limit", String(limit));
  return requestProviderJson(
    requestUrl,
    walletPositionsResponseSchema,
    clientOptions,
  );
}
