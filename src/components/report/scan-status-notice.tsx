/**
 * File: src/components/report/scan-status-notice.tsx
 * Purpose: Full-width notice for every scan outcome that is not a diagnosis:
 * not enough history, rate limited, provider unavailable, or the scanner not
 * yet configured. Each says what happened and what to do next.
 */
import {
  CloudOff,
  FileSearch,
  Hourglass,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { WalletScanForm } from "@/components/wallet-scan-form";

export type ScanNoticeKind =
  | {
      kind: "insufficient_history";
      closedPositionCount: number;
      minimumClosedPositions: number;
    }
  | { kind: "rate_limited"; retryAfterSeconds: number }
  | { kind: "provider_busy" }
  | { kind: "provider_unavailable" }
  | { kind: "scanner_unconfigured" };

interface NoticeContent {
  icon: LucideIcon;
  title: string;
  body: ReactNode;
  /** Whether offering another scan makes sense for this outcome. */
  offersAnotherScan: boolean;
}

function resolveNoticeContent(notice: ScanNoticeKind): NoticeContent {
  switch (notice.kind) {
    case "insufficient_history":
      return {
        icon: FileSearch,
        title: "Not enough history to diagnose",
        body: (
          <>
            This wallet has {notice.closedPositionCount} closed{" "}
            {notice.closedPositionCount === 1 ? "position" : "positions"} on
            record. A score needs at least {notice.minimumClosedPositions}. New
            wallets, wallets that only hold and wallets that only receive
            transfers will not have enough.
          </>
        ),
        offersAnotherScan: true,
      };
    case "rate_limited":
      return {
        icon: Hourglass,
        title: "Too many scans in a row",
        body: (
          <>
            You have reached the scan limit for now. Try again in about{" "}
            {notice.retryAfterSeconds}{" "}
            {notice.retryAfterSeconds === 1 ? "second" : "seconds"}.
          </>
        ),
        offersAnotherScan: false,
      };
    case "provider_busy":
      return {
        icon: Hourglass,
        title: "The waiting room is full",
        body: (
          <>
            Our data provider is limiting requests right now. Nothing is wrong
            with this wallet. Reload the page in a minute.
          </>
        ),
        offersAnotherScan: false,
      };
    case "provider_unavailable":
      return {
        icon: CloudOff,
        title: "Trading history is unavailable right now",
        body: (
          <>
            We could not reach the service that supplies trading history.
            Nothing is wrong with this wallet. Reload the page in a minute.
          </>
        ),
        offersAnotherScan: false,
      };
    case "scanner_unconfigured":
      return {
        icon: Wrench,
        title: "The scanner is not connected yet",
        body: (
          <>
            This deployment has no data provider key. If you run this site, set{" "}
            <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
              SOLANA_TRACKER_API_KEY
            </code>{" "}
            in the environment and redeploy.
          </>
        ),
        offersAnotherScan: false,
      };
  }
}

interface ScanStatusNoticeProps {
  notice: ScanNoticeKind;
}

export function ScanStatusNotice({ notice }: ScanStatusNoticeProps) {
  const noticeContent = resolveNoticeContent(notice);

  return (
    <section className="flex flex-col gap-8 rounded-xl border border-line bg-surface p-6 sm:p-10">
      <div className="flex max-w-2xl flex-col gap-4">
        <noticeContent.icon
          aria-hidden="true"
          className="size-6 text-ink-soft"
          strokeWidth={1.5}
        />
        <h2 className="font-display text-4xl leading-[1.05] text-ink">
          {noticeContent.title}
        </h2>
        <p className="text-base leading-relaxed text-ink-soft">
          {noticeContent.body}
        </p>
      </div>
      {noticeContent.offersAnotherScan ? (
        <div className="max-w-xl border-t border-line pt-8">
          <WalletScanForm submitLabel="Scan another wallet" />
        </div>
      ) : null}
    </section>
  );
}
