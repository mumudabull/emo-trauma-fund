/**
 * File: tests/sliding-window-rate-limiter.test.ts
 * Purpose: Unit tests for the in-memory sliding-window rate limiter, using
 * injected timestamps so the window behaviour is deterministic.
 */
import { describe, expect, it } from "vitest";
import { SlidingWindowRateLimiter } from "@/lib/rate-limit/sliding-window-rate-limiter";

describe("SlidingWindowRateLimiter", () => {
  it("allows requests up to the limit and then blocks", () => {
    const rateLimiter = new SlidingWindowRateLimiter({
      maximumRequests: 3,
      windowMilliseconds: 60_000,
    });
    expect(rateLimiter.consume("client-a", 1_000).isAllowed).toBe(true);
    expect(rateLimiter.consume("client-a", 2_000).isAllowed).toBe(true);
    const thirdDecision = rateLimiter.consume("client-a", 3_000);
    expect(thirdDecision.isAllowed).toBe(true);
    expect(thirdDecision.remainingRequests).toBe(0);

    const blockedDecision = rateLimiter.consume("client-a", 4_000);
    expect(blockedDecision.isAllowed).toBe(false);
    // The oldest request (t=1s) leaves the 60s window at t=61s: 57s away.
    expect(blockedDecision.retryAfterSeconds).toBe(57);
  });

  it("allows requests again once the window has passed", () => {
    const rateLimiter = new SlidingWindowRateLimiter({
      maximumRequests: 1,
      windowMilliseconds: 10_000,
    });
    expect(rateLimiter.consume("client-a", 0).isAllowed).toBe(true);
    expect(rateLimiter.consume("client-a", 9_999).isAllowed).toBe(false);
    expect(rateLimiter.consume("client-a", 10_001).isAllowed).toBe(true);
  });

  it("tracks clients independently", () => {
    const rateLimiter = new SlidingWindowRateLimiter({
      maximumRequests: 1,
      windowMilliseconds: 60_000,
    });
    expect(rateLimiter.consume("client-a", 0).isAllowed).toBe(true);
    expect(rateLimiter.consume("client-b", 0).isAllowed).toBe(true);
    expect(rateLimiter.consume("client-a", 1).isAllowed).toBe(false);
  });

  it("does not count blocked requests against the window", () => {
    const rateLimiter = new SlidingWindowRateLimiter({
      maximumRequests: 1,
      windowMilliseconds: 10_000,
    });
    rateLimiter.consume("client-a", 0);
    // Repeated blocked attempts must not extend the block.
    rateLimiter.consume("client-a", 5_000);
    rateLimiter.consume("client-a", 9_000);
    expect(rateLimiter.consume("client-a", 10_001).isAllowed).toBe(true);
  });

  it("evicts the least recently active client beyond the tracking cap", () => {
    const rateLimiter = new SlidingWindowRateLimiter({
      maximumRequests: 1,
      windowMilliseconds: 60_000,
      maximumTrackedClients: 2,
    });
    rateLimiter.consume("client-a", 0);
    rateLimiter.consume("client-b", 1);
    rateLimiter.consume("client-c", 2);
    // client-a was evicted, so its earlier request is forgotten.
    expect(rateLimiter.consume("client-a", 3).isAllowed).toBe(true);
    // client-c is still tracked and still limited.
    expect(rateLimiter.consume("client-c", 4).isAllowed).toBe(false);
  });
});
