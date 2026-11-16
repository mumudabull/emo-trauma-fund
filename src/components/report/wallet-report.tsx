/**
 * File: src/components/report/wallet-report.tsx
 * Purpose: Server component that performs a wallet scan and renders its
 * outcome. It reads the route parameter and request headers, so it must be
 * rendered inside a Suspense boundary; the report page provides one.
 */
import { ArrowUpRight, Bot } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import nursePortrait from "@/assets/art/nurse-portrait.jpg";
import { ReportStatGrid } from "@/components/report/report-stat-grid";
import {
  ScanStatusNotice,
  type ScanNoticeKind,
} from "@/components/report/scan-status-notice";
import { ScoreBreakdown } from "@/components/report/score-breakdown";
import { ShareReportActions } from "@/components/report/share-report-actions";
import { TraumaScorePanel } from "@/components/report/trauma-score-panel";
import { WorstPositionsTable } from "@/components/report/worst-positions-table";
import { buildWalletExplorerUrl } from "@/lib/config/site-config";
import { formatUtcDate } from "@/lib/format/format-values";
import { consumeScanRequestBudget } from "@/lib/rate-limit/scan-request-guard";
import { scanWallet } from "@/lib/scanner/scan-wallet";
import type { WalletScanResult } from "@/lib/scanner/types";
import {
  parseSolanaWalletAddress,
  truncateWalletAddress,
} from "@/lib/solana/wallet-address";

interface WalletReportProps {
  /** The route params promise from the page, awaited here inside Suspense. */
  params: Promise<{ wallet: string }>;
}

function ReportHeader({
  walletAddress,
  dataAsOfLabel,
}: {
  walletAddress: string;
  dataAsOfLabel: string | null;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-4">
        {/* Decorative: the heading beside it already names the report. */}
        <Image
          src={nursePortrait}
          alt=""
          placeholder="blur"
          sizes="4rem"
          className="size-14 shrink-0 rounded-full border border-line sm:size-16"
        />
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            Patient report · reviewed by the nurse on duty
          </p>
          <h1 className="font-display text-4xl leading-none text-ink sm:text-5xl">
            Wallet{" "}
            <span className="font-mono text-[0.6em] tracking-tight text-ink-soft">
              {truncateWalletAddress(walletAddress, 5)}
            </span>
          </h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
        {dataAsOfLabel ? <span>Data as of {dataAsOfLabel}</span> : null}
        <a
          href={buildWalletExplorerUrl(walletAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition-colors hover:text-ink"
        >
          View on Solscan
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </a>
      </div>
    </header>
  );
}

/** Maps a non-diagnosed scan result to the notice shown to the visitor. */
function resolveScanNotice(
  scanResult: Exclude<WalletScanResult, { status: "diagnosed" }>,
): ScanNoticeKind {
  switch (scanResult.status) {
    case "insufficient_history":
      return {
        kind: "insufficient_history",
        closedPositionCount: scanResult.closedPositionCount,
        minimumClosedPositions: scanResult.minimumClosedPositions,
      };
    case "scanner_unconfigured":
      return { kind: "scanner_unconfigured" };
    case "provider_unavailable":
      return scanResult.reason === "rate_limited"
        ? { kind: "provider_busy" }
        : { kind: "provider_unavailable" };
  }
}

export async function WalletReport({ params }: WalletReportProps) {
  const { wallet: rawWalletParameter } = await params;
  const walletAddress = parseSolanaWalletAddress(rawWalletParameter);
  if (!walletAddress) {
    notFound();
  }

  // connection() marks everything below as request-time work. Without it,
  // Next.js may run this component during a prefetch-time prerender, where
  // the rate limiter (which reads the clock and must count real requests
  // only) is not allowed to run.
  await connection();

  // The rate limit is checked before the scan so a blocked client never
  // reaches the data provider, even on a cache miss.
  const rateLimitDecision = consumeScanRequestBudget(await headers());
  if (!rateLimitDecision.isAllowed) {
    return (
      <div className="flex flex-col gap-6">
        <ReportHeader walletAddress={walletAddress} dataAsOfLabel={null} />
        <ScanStatusNotice
          notice={{
            kind: "rate_limited",
            retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
          }}
        />
      </div>
    );
  }

  const scanResult = await scanWallet(walletAddress);

  if (scanResult.status !== "diagnosed") {
    return (
      <div className="flex flex-col gap-6">
        <ReportHeader walletAddress={walletAddress} dataAsOfLabel={null} />
        <ScanStatusNotice notice={resolveScanNotice(scanResult)} />
      </div>
    );
  }

  const { profile, assessment } = scanResult;
  const dataAsOfLabel = formatUtcDate(
    profile.dataUpdatedAt ?? scanResult.scannedAt,
  );

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        walletAddress={walletAddress}
        dataAsOfLabel={dataAsOfLabel}
      />

      {profile.automatedWalletLabel ? (
        <p className="flex items-start gap-3 rounded-lg border border-caution/25 bg-caution-soft p-4 text-sm leading-relaxed text-ink">
          <Bot
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-caution"
          />
          <span>
            Our data provider labels this wallet as:{" "}
            <strong className="font-medium">
              {profile.automatedWalletLabel}
            </strong>
            . Automated and institutional wallets still get a score, but they
            will not be eligible for claims.
          </span>
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] lg:items-start">
        <TraumaScorePanel assessment={assessment} />
        <ShareReportActions
          walletAddress={walletAddress}
          assessment={assessment}
        />
      </div>

      <ReportStatGrid profile={profile} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <ScoreBreakdown assessment={assessment} />
        <WorstPositionsTable worstPositions={profile.worstPositions} />
      </div>

      <p className="max-w-3xl text-xs leading-relaxed text-ink-faint">
        Based on public swap history for this address, in US dollars. Losses on
        other chains, on centralized exchanges and in perpetuals are not
        included. A trauma score is entertainment, not a claim on the fund and
        not financial advice.
      </p>
    </div>
  );
}
