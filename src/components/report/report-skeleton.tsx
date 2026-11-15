/**
 * File: src/components/report/report-skeleton.tsx
 * Purpose: Placeholder shown while a wallet scan streams in. It mirrors the
 * report layout so the page does not jump when the result arrives, and it
 * announces the wait to assistive technology.
 */

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-line motion-safe:animate-pulse ${className}`}
    />
  );
}

export function ReportSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
        Reviewing chart history
      </p>
      <span className="sr-only">
        Scanning wallet. This takes a few seconds.
      </span>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
        <div className="flex flex-col gap-8 rounded-xl border border-line bg-surface p-6 sm:p-8">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-24 w-40" />
          <SkeletonBlock className="h-10 w-72 max-w-full" />
          <SkeletonBlock className="h-2 w-full rounded-full" />
        </div>
        <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6 sm:p-8">
          <SkeletonBlock className="h-8 w-40" />
          <SkeletonBlock className="h-11 w-full" />
          <SkeletonBlock className="h-11 w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        {Array.from({ length: 8 }, (_unused, statIndex) => (
          <div key={statIndex} className="flex flex-col gap-3 bg-surface p-5">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-7 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
