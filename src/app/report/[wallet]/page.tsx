/**
 * File: src/app/report/[wallet]/page.tsx
 * Purpose: Report page for one wallet: /report/{walletAddress}. The static
 * shell (navigation, back link) is prerendered; the scan itself streams in
 * through Suspense because it depends on the route parameter and the request.
 */
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ReportSkeleton } from "@/components/report/report-skeleton";
import { WalletReport } from "@/components/report/wallet-report";
import { buildReportPath, siteConfig } from "@/lib/config/site-config";
import {
  parseSolanaWalletAddress,
  truncateWalletAddress,
} from "@/lib/solana/wallet-address";

/**
 * Metadata deliberately does not run a scan. The score reaches social
 * previews through the generated share-card image instead, which keeps a
 * cold page load to a single pair of provider calls.
 */
export async function generateMetadata({
  params,
}: PageProps<"/report/[wallet]">): Promise<Metadata> {
  const { wallet: rawWalletParameter } = await params;
  const walletAddress = parseSolanaWalletAddress(rawWalletParameter);

  if (!walletAddress) {
    return { title: "Wallet not found", robots: { index: false } };
  }

  const truncatedAddress = truncateWalletAddress(walletAddress);
  const title = `Trauma report for ${truncatedAddress}`;
  const description = `Trauma score, diagnosis and worst positions for Solana wallet ${truncatedAddress}, reviewed by the ${siteConfig.name}.`;

  return {
    title,
    description,
    // Individual wallet reports are for sharing, not for search indexes.
    robots: { index: false, follow: true },
    alternates: { canonical: buildReportPath(walletAddress) },
    openGraph: {
      title,
      description,
      url: buildReportPath(walletAddress),
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ReportPage({ params }: PageProps<"/report/[wallet]">) {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
        <Link
          href="/#scanner"
          className="inline-flex w-fit items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Scan another wallet
        </Link>

        <Suspense fallback={<ReportSkeleton />}>
          <WalletReport params={params} />
        </Suspense>
      </div>
    </main>
  );
}
