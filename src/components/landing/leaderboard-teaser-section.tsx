/**
 * File: src/components/landing/leaderboard-teaser-section.tsx
 * Purpose: Landing-page section for the leaderboard. Shows the current top
 * five when the board is live, and teases it with reserved ranks before
 * then. The board itself is request-time data, so it streams in through
 * Suspense while the rest of the landing page stays static.
 */
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  LeaderboardList,
  LeaderboardRowsSkeleton,
  ReservedBedRows,
} from "@/components/leaderboard/leaderboard-rows";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { formatInteger } from "@/lib/format/format-values";
import { loadLeaderboardSnapshot } from "@/lib/leaderboard/leaderboard-store";

/** Entries shown in the landing-page preview. */
const PREVIEW_ENTRY_COUNT = 5;

async function LeaderboardPreview() {
  // The board changes as wallets are scanned, so it is read per request.
  await connection();
  const leaderboardSnapshot =
    await loadLeaderboardSnapshot(PREVIEW_ENTRY_COUNT);

  if (
    leaderboardSnapshot.status === "live" &&
    leaderboardSnapshot.entries.length > 0
  ) {
    return (
      <div className="flex flex-col gap-5">
        <LeaderboardList entries={leaderboardSnapshot.entries} />
        <Link
          href="/leaderboard"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-accent"
        >
          See the full list
          <span className="font-normal text-ink-faint">
            {formatInteger(leaderboardSnapshot.rankedWalletCount)}{" "}
            {leaderboardSnapshot.rankedWalletCount === 1 ? "wallet" : "wallets"}{" "}
            ranked
          </span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    );
  }

  // Live but empty reads differently from not open yet: the first tells the
  // visitor a scan will place them, the second only promises the opening.
  const isOpenAndEmpty = leaderboardSnapshot.status === "live";

  return (
    <div className="flex flex-col gap-5">
      <ReservedBedRows rowCount={PREVIEW_ENTRY_COUNT} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {isOpenAndEmpty ? (
          <p className="text-sm text-ink-soft">
            No admissions yet. The first wallet scanned takes bed one.
          </p>
        ) : (
          <>
            <StatusPill tone="next">Opening soon</StatusPill>
            <p className="text-sm text-ink-soft">
              When the list opens, it will rank the wallets scanned here by
              trauma score.
            </p>
          </>
        )}
        <Link
          href="/#scanner"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-accent"
        >
          Scan a wallet
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export function LeaderboardTeaserSection() {
  return (
    <section
      id="leaderboard"
      aria-labelledby="leaderboard-title"
      className="border-t border-line"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div>
          <SectionHeading
            titleId="leaderboard-title"
            label="Leaderboard"
            title="The critical list"
          >
            The highest trauma scores on Solana, ranked. Nobody wants to be
            first, and somebody always is.
          </SectionHeading>
        </div>

        <Suspense
          fallback={<LeaderboardRowsSkeleton rowCount={PREVIEW_ENTRY_COUNT} />}
        >
          <LeaderboardPreview />
        </Suspense>
      </div>
    </section>
  );
}
