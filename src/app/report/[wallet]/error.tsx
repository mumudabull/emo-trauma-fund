/**
 * File: src/app/report/[wallet]/error.tsx
 * Purpose: Error boundary for the report route. Catches unexpected failures
 * while scanning or rendering a report and offers a retry, so a visitor never
 * lands on a blank page.
 */
"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

interface ReportErrorProps {
  error: unknown;
  retry: () => void;
}

export default function ReportError({ error, retry }: ReportErrorProps) {
  useEffect(() => {
    // Surfaces the failure in the browser console and to any attached
    // error-reporting integration.
    console.error("[report] failed to render wallet report", error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-5 py-16 sm:px-8">
        <section className="flex max-w-2xl flex-col gap-5 rounded-xl border border-line bg-surface p-6 sm:p-10">
          <TriangleAlert
            aria-hidden="true"
            className="size-6 text-ink-soft"
            strokeWidth={1.5}
          />
          <h1 className="font-display text-4xl leading-[1.05] text-ink">
            This report could not be prepared
          </h1>
          <p className="text-base leading-relaxed text-ink-soft">
            Something went wrong on our side while reviewing this wallet. Your
            wallet is unaffected. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <RotateCw aria-hidden="true" className="size-4" />
            Try again
          </button>
        </section>
      </div>
    </main>
  );
}
