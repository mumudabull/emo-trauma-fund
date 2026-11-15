/**
 * File: src/lib/rate-limit/sliding-window-rate-limiter.ts
 * Purpose: A dependency-free sliding-window rate limiter held in process
 * memory. It protects the data provider quota from a single client hammering
 * the scanner.
 *
 * Scope: state lives in one Node.js process. On a single server (VPS, Replit,
 * a container) the limit is exact. On serverless platforms each warm instance
 * keeps its own window, so the effective limit is per instance; the scan
 * cache remains the primary quota protection there. For a strict global limit
 * across instances, back the same interface with Redis.
 */

export interface RateLimitDecision {
  isAllowed: boolean;
  /** Requests left in the current window after this one. */
  remainingRequests: number;
  /** Seconds until the oldest counted request leaves the window. */
  retryAfterSeconds: number;
}

export interface SlidingWindowRateLimiterOptions {
  maximumRequests: number;
  windowMilliseconds: number;
  /** Upper bound on tracked clients, so memory cannot grow without limit. */
  maximumTrackedClients?: number;
}

export class SlidingWindowRateLimiter {
  private readonly maximumRequests: number;
  private readonly windowMilliseconds: number;
  private readonly maximumTrackedClients: number;
  /** Client key to the timestamps (ms) of its requests inside the window. */
  private readonly requestTimestampsByClient = new Map<string, number[]>();

  constructor({
    maximumRequests,
    windowMilliseconds,
    maximumTrackedClients = 20_000,
  }: SlidingWindowRateLimiterOptions) {
    this.maximumRequests = maximumRequests;
    this.windowMilliseconds = windowMilliseconds;
    this.maximumTrackedClients = maximumTrackedClients;
  }

  /**
   * Records a request for `clientKey` and reports whether it is allowed.
   * `currentTimeMilliseconds` is injectable for deterministic tests.
   */
  consume(
    clientKey: string,
    currentTimeMilliseconds: number = Date.now(),
  ): RateLimitDecision {
    const windowStart = currentTimeMilliseconds - this.windowMilliseconds;
    const recentTimestamps = (
      this.requestTimestampsByClient.get(clientKey) ?? []
    ).filter((timestamp) => timestamp > windowStart);

    if (recentTimestamps.length >= this.maximumRequests) {
      this.requestTimestampsByClient.set(clientKey, recentTimestamps);
      const oldestTimestamp = recentTimestamps[0];
      return {
        isAllowed: false,
        remainingRequests: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil(
            (oldestTimestamp +
              this.windowMilliseconds -
              currentTimeMilliseconds) /
              1_000,
          ),
        ),
      };
    }

    recentTimestamps.push(currentTimeMilliseconds);
    // Re-inserting moves the key to the end of the Map's insertion order,
    // which makes the first key the least recently active client.
    this.requestTimestampsByClient.delete(clientKey);
    this.requestTimestampsByClient.set(clientKey, recentTimestamps);
    this.evictLeastRecentlyActiveClients();

    return {
      isAllowed: true,
      remainingRequests: this.maximumRequests - recentTimestamps.length,
      retryAfterSeconds: 0,
    };
  }

  private evictLeastRecentlyActiveClients(): void {
    while (this.requestTimestampsByClient.size > this.maximumTrackedClients) {
      const leastRecentlyActiveKey = this.requestTimestampsByClient
        .keys()
        .next().value;
      if (leastRecentlyActiveKey === undefined) {
        return;
      }
      this.requestTimestampsByClient.delete(leastRecentlyActiveKey);
    }
  }
}
