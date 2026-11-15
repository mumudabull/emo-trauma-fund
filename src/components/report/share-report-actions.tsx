/**
 * File: src/components/report/share-report-actions.tsx
 * Purpose: Share controls for a diagnosed report: post to X with the score
 * prefilled, or copy the report link. The report URL carries its own share
 * card image, which X renders under the post.
 */
import { ArrowUpRight } from "lucide-react";
import { CopyTextButton } from "@/components/copy-text-button";
import { buildReportUrl } from "@/lib/config/site-config";
import type { TraumaAssessment } from "@/lib/scanner/types";
import { buildShareOnXUrl } from "@/lib/share-card/share-text";

interface ShareReportActionsProps {
  walletAddress: string;
  assessment: TraumaAssessment;
}

export function ShareReportActions({
  walletAddress,
  assessment,
}: ShareReportActionsProps) {
  return (
    <section
      aria-labelledby="share-report-title"
      className="flex min-w-0 flex-col gap-5 rounded-xl border border-line bg-surface p-6 sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="share-report-title"
          className="font-display text-3xl leading-none text-ink"
        >
          File it publicly
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          The link shows this report and attaches a card with the score and
          diagnosis.
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        <a
          href={buildShareOnXUrl(walletAddress, assessment)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Share on X
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
        <CopyTextButton
          textToCopy={buildReportUrl(walletAddress)}
          label="Copy report link"
          className="h-11"
        />
      </div>
    </section>
  );
}
