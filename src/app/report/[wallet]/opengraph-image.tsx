/**
 * File: src/app/report/[wallet]/opengraph-image.tsx
 * Purpose: Social share image for a wallet report. Shows the trauma score and
 * diagnosis when the wallet can be scored, and falls back to the brand card
 * otherwise, so a shared link always has an image.
 */
import { headers } from "next/headers";
import { consumeScanRequestBudget } from "@/lib/rate-limit/scan-request-guard";
import { scanWallet } from "@/lib/scanner/scan-wallet";
import {
  renderBrandShareCard,
  renderReportShareCard,
  SHARE_CARD_CONTENT_TYPE,
  SHARE_CARD_SIZE,
} from "@/lib/share-card/render-share-card";
import { parseSolanaWalletAddress } from "@/lib/solana/wallet-address";

export const alt =
  "Emotional Trauma Fund patient report with trauma score and diagnosis";
export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_CONTENT_TYPE;

export default async function ReportOpenGraphImage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet: rawWalletParameter } = await params;
  const walletAddress = parseSolanaWalletAddress(rawWalletParameter);
  if (!walletAddress) {
    return renderBrandShareCard({ cachePolicy: "fallback" });
  }

  // This route can trigger a provider call just like the page can, so it
  // draws from the same per-client budget. Social crawlers normally arrive
  // right after the page render and are served from the scan cache.
  const rateLimitDecision = consumeScanRequestBudget(await headers());
  if (!rateLimitDecision.isAllowed) {
    return renderBrandShareCard({
      contextLabel: "Patient report",
      cachePolicy: "fallback",
    });
  }

  const scanResult = await scanWallet(walletAddress);
  if (scanResult.status !== "diagnosed") {
    return renderBrandShareCard({
      contextLabel: "Patient report",
      cachePolicy: "fallback",
    });
  }

  return renderReportShareCard(walletAddress, scanResult.assessment);
}
