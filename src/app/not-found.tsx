/**
 * File: src/app/not-found.tsx
 * Purpose: Not-found page. Shown for unknown routes and for report links
 * whose path is not a valid Solana wallet address. Offers the scan form so
 * the visitor can recover in one step.
 */
import { FileSearch } from "lucide-react";
import type { Metadata } from "next";
import { WalletScanForm } from "@/components/wallet-scan-form";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-5 py-16 sm:px-8">
        <section className="flex max-w-2xl flex-col gap-8 rounded-xl border border-line bg-surface p-6 sm:p-10">
          <div className="flex flex-col gap-4">
            <FileSearch
              aria-hidden="true"
              className="size-6 text-ink-soft"
              strokeWidth={1.5}
            />
            <h1 className="font-display text-4xl leading-[1.05] text-ink">
              No file under that name
            </h1>
            <p className="text-base leading-relaxed text-ink-soft">
              That page does not exist, or the link does not contain a valid
              Solana wallet address. Paste an address below to open a report.
            </p>
          </div>
          <div className="border-t border-line pt-8">
            <WalletScanForm />
          </div>
        </section>
      </div>
    </main>
  );
}
