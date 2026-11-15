/**
 * File: src/app/api/scan/[wallet]/route.ts
 * Purpose: JSON API for wallet scans: GET /api/scan/{walletAddress}. Returns
 * the same result the report page renders, so other clients (the planned
 * Telegram bot, partner integrations) can reuse the scanner.
 */
import type { NextRequest } from "next/server";
import { consumeScanRequestBudget } from "@/lib/rate-limit/scan-request-guard";
import { scanWallet } from "@/lib/scanner/scan-wallet";
import type { WalletScanResult } from "@/lib/scanner/types";
import { parseSolanaWalletAddress } from "@/lib/solana/wallet-address";

/** Scan responses depend on the caller's rate limit, so they are never shared. */
const RESPONSE_HEADERS = { "Cache-Control": "private, no-store" } as const;

function resolveHttpStatus(scanResult: WalletScanResult): number {
  switch (scanResult.status) {
    case "diagnosed":
    case "insufficient_history":
      return 200;
    case "scanner_unconfigured":
      return 503;
    case "provider_unavailable":
      return scanResult.reason === "rate_limited" ? 503 : 502;
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/scan/[wallet]">,
) {
  const { wallet: rawWalletParameter } = await context.params;
  const walletAddress = parseSolanaWalletAddress(rawWalletParameter);
  if (!walletAddress) {
    return Response.json(
      {
        status: "invalid_wallet_address",
        message: "The path parameter is not a valid Solana wallet address.",
      },
      { status: 400, headers: RESPONSE_HEADERS },
    );
  }

  const rateLimitDecision = consumeScanRequestBudget(request.headers);
  if (!rateLimitDecision.isAllowed) {
    return Response.json(
      {
        status: "rate_limited",
        message: "Too many scans from this client. Retry shortly.",
        retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          ...RESPONSE_HEADERS,
          "Retry-After": String(rateLimitDecision.retryAfterSeconds),
        },
      },
    );
  }

  const scanResult = await scanWallet(walletAddress);
  return Response.json(scanResult, {
    status: resolveHttpStatus(scanResult),
    headers: RESPONSE_HEADERS,
  });
}
