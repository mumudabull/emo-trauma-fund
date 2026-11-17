/**
 * File: src/app/leaderboard/page.tsx
 * Purpose: The full leaderboard at /leaderboard: the highest trauma scores
 * among wallets scanned on the site. The page shell is static and the board
 * streams in, because it changes as wallets are scanned.
 */
import { ArrowRight, CloudOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  LeaderboardList,
  LeaderboardRowsSkeleton,
  ReservedBedRows,
} from "@/components/leaderboard/leaderboard-rows";
import { StatusPill } from "@/components/status-pill";
import { siteConfig } from "@/lib/config/site-config";
import { formatInteger } from "@/lib/format/format-values";
import { loadLeaderboardSnapshot } from "@/lib/leaderboard/leaderboard-store";

/** Entries shown on the full board. */
const BOARD_ENTRY_COUNT = 50;

/** Rows shown as reserved while the board has no entries. */
const RESERVED_ROW_COUNT = 10;

export const metadata: Metadata = {
  title: "Leaderboard",
  description: `The critical list: the highest trauma scores among Solana wallets scanned by the ${siteConfig.name}.`,
  alternates: { canonical: "/leaderboard" },
};

function ScanCallToAction({ label }: { label: string }) {
  return (
    <Link
      href="/#scanner"
      className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
    >
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}

async function LeaderboardBoard() {
  await connection();
  const leaderboardSnapshot = await loadLeaderboardSnapshot(BOARD_ENTRY_COUNT);

  if (leaderboardSnapshot.status === "unavailable") {
    return (
      <div className="flex max-w-2xl flex-col gap-4 rounded-xl border border-line bg-surface p-6 sm:p-10">
        <CloudOff
          aria-hidden="true"
          className="size-6 text-ink-soft"
          strokeWidth={1.5}
        />
        <h2 className="font-display text-3xl leading-[1.05] text-ink">
          The list is unavailable right now
        </h2>
        <p className="text-base leading-relaxed text-ink-soft">
          We could not read the leaderboard. Scores are safe and scans still
          work. Reload the page in a minute.
        </p>
      </div>
    );
  }

  if (leaderboardSnapshot.status === "not_configured") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone="next">Opening soon</StatusPill>
          <p className="text-sm text-ink-soft">
            The list is not open yet. When it opens, it will rank the wallets
            scanned here by trauma score.
          </p>
        </div>
        <ReservedBedRows rowCount={RESERVED_ROW_COUNT} />
        <ScanCallToAction label="Scan a wallet" />
      </div>
    );
  }

  if (leaderboardSnapshot.entries.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink-soft">
          No admissions yet. The first wallet scanned takes bed one.
        </p>
        <ReservedBedRows rowCount={RESERVED_ROW_COUNT} />
        <ScanCallToAction label="Scan the first wallet" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft">
        Showing the top {formatInteger(leaderboardSnapshot.entries.length)} of{" "}
        {formatInteger(leaderboardSnapshot.rankedWalletCount)} ranked{" "}
        {leaderboardSnapshot.rankedWalletCount === 1 ? "wallet" : "wallets"}.
        Updated about once a minute.
      </p>
      <LeaderboardList entries={leaderboardSnapshot.entries} />
      <ScanCallToAction label="Scan a wallet to get ranked" />
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <header className="flex max-w-2xl flex-col gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            Leaderboard
          </p>
          <h1 className="font-display text-5xl leading-none text-ink sm:text-6xl">
            The critical list
          </h1>
          <p className="text-lg leading-relaxed text-ink-soft">
            The highest trauma scores among wallets scanned here. Ties go to the
            wallet with more lost in its worst bags.
          </p>
        </header>

        <Suspense
          fallback={<LeaderboardRowsSkeleton rowCount={RESERVED_ROW_COUNT} />}
        >
          <LeaderboardBoard />
        </Suspense>

        <p className="max-w-2xl text-xs leading-relaxed text-ink-faint">
          A wallet is ranked when anyone scans it, and a new scan replaces its
          previous entry. Addresses and trading history are public on-chain
          data. Wallets labelled as bots, exchanges or liquidity pools are not
          ranked. Being on this list does not entitle a wallet to anything.
        </p>
      </div>
    </main>
  );
}
