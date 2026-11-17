/**
 * File: src/lib/share-card/share-text.ts
 * Purpose: Builds the text and the X (Twitter) intent link used when a
 * visitor shares a report, so the wording lives in one place.
 */
import { buildReportUrl, siteConfig } from "@/lib/config/site-config";
import type { TraumaAssessment } from "@/lib/scanner/types";

export function buildReportShareText(assessment: TraumaAssessment): string {
  // Mentioning the project's account makes every shared report point back to
  // it. The mention is dropped if no handle can be derived from the X link.
  const reviewer = siteConfig.xHandle
    ? `${siteConfig.xHandle} (${siteConfig.ticker})`
    : `The ${siteConfig.ticker} loss scanner`;
  return `Trauma score: ${assessment.score}/100. Diagnosis: ${assessment.tier.name}. ${reviewer} has reviewed my chart history.`;
}

/**
 * Link that opens X's composer with the share text and the report URL
 * prefilled. The report URL carries its own share-card image.
 */
export function buildShareOnXUrl(
  walletAddress: string,
  assessment: TraumaAssessment,
): string {
  const intentUrl = new URL("https://x.com/intent/post");
  intentUrl.searchParams.set("text", buildReportShareText(assessment));
  intentUrl.searchParams.set("url", buildReportUrl(walletAddress));
  return intentUrl.toString();
}
