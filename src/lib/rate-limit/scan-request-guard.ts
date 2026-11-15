/**
 * File: src/lib/rate-limit/scan-request-guard.ts
 * Purpose: Applies the per-client scan rate limit to an incoming request.
 * Used by the report page, the share-card image and the JSON API, which are
 * the three routes that can trigger a provider call.
 */
import "server-only";
import { getServerConfig } from "@/lib/config/server-config";
import {
  SlidingWindowRateLimiter,
  type RateLimitDecision,
} from "./sliding-window-rate-limiter";

const ONE_MINUTE_IN_MILLISECONDS = 60_000;

/**
 * The limiter is stored on globalThis so development hot reloads and separate
 * route bundles within one process share a single window.
 */
const globalWithScanLimiter = globalThis as typeof globalThis & {
  emotionalTraumaFundScanLimiter?: SlidingWindowRateLimiter;
};

function getScanRateLimiter(): SlidingWindowRateLimiter {
  if (!globalWithScanLimiter.emotionalTraumaFundScanLimiter) {
    globalWithScanLimiter.emotionalTraumaFundScanLimiter =
      new SlidingWindowRateLimiter({
        maximumRequests: getServerConfig().scanRateLimitPerMinute,
        windowMilliseconds: ONE_MINUTE_IN_MILLISECONDS,
      });
  }
  return globalWithScanLimiter.emotionalTraumaFundScanLimiter;
}

/**
 * Derives a client key from proxy headers.
 *
 * x-forwarded-for is set by the hosting platform or reverse proxy (Vercel,
 * nginx, Cloudflare). The first entry is the original client. If the app is
 * ever exposed without a proxy that overwrites this header, a client could
 * spoof it, so keep the app behind one in production.
 */
export function resolveClientKey(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const firstForwardedAddress = forwardedFor?.split(",")[0]?.trim();
  if (firstForwardedAddress) {
    return firstForwardedAddress;
  }
  const realIpAddress = requestHeaders.get("x-real-ip")?.trim();
  if (realIpAddress) {
    return realIpAddress;
  }
  // Without any client address every such request shares one bucket, which
  // fails safe: the limit is stricter, never looser.
  return "unidentified-client";
}

/** Counts this request against the caller's scan budget. */
export function consumeScanRequestBudget(
  requestHeaders: Headers,
): RateLimitDecision {
  return getScanRateLimiter().consume(resolveClientKey(requestHeaders));
}
