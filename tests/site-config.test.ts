/**
 * File: tests/site-config.test.ts
 * Purpose: Checks the public site configuration: the official channels and
 * the X handle derived from the X link.
 */
import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/config/site-config";
import { buildReportShareText } from "@/lib/share-card/share-text";
import { TRAUMA_TIERS } from "@/lib/scanner/trauma-score";

describe("siteConfig", () => {
  it("points at the official channels by default", () => {
    expect(siteConfig.xUrl).toBe("https://x.com/soltrauma");
    expect(siteConfig.telegramUrl).toBe("https://t.me/emotionaltraumafund");
  });

  it("derives the X handle from the X link", () => {
    expect(siteConfig.xHandle).toBe("@soltrauma");
  });
});

describe("buildReportShareText", () => {
  it("mentions the project's X account and stays well under 280 characters", () => {
    const longestTier = TRAUMA_TIERS[TRAUMA_TIERS.length - 1];
    const shareText = buildReportShareText({
      score: 100,
      tier: longestTier,
      components: [],
    });
    expect(shareText).toContain("@soltrauma");
    expect(shareText).toContain("100/100");
    // X counts the appended report link as 23 characters.
    expect(shareText.length + 1 + 23).toBeLessThanOrEqual(280);
  });
});
