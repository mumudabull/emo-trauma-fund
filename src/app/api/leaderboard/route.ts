/**
 * File: src/app/api/leaderboard/route.ts
 * Purpose: JSON API for the leaderboard: GET /api/leaderboard?limit=25.
 * Returns the same ranked entries the leaderboard page shows, so the planned
 * Telegram bot and other clients can reuse it.
 */
import type { NextRequest } from "next/server";
import {
  loadLeaderboardSnapshot,
  MAXIMUM_LEADERBOARD_PAGE_SIZE,
} from "@/lib/leaderboard/leaderboard-store";

const DEFAULT_ENTRY_LIMIT = 25;

/**
 * Reads the optional `limit` query parameter. Returns null when it is
 * present but not a whole number within the allowed range.
 */
function parseEntryLimit(rawLimit: string | null): number | null {
  if (rawLimit === null) {
    return DEFAULT_ENTRY_LIMIT;
  }
  if (!/^\d{1,3}$/.test(rawLimit)) {
    return null;
  }
  const entryLimit = Number(rawLimit);
  return entryLimit >= 1 && entryLimit <= MAXIMUM_LEADERBOARD_PAGE_SIZE
    ? entryLimit
    : null;
}

export async function GET(request: NextRequest) {
  const entryLimit = parseEntryLimit(request.nextUrl.searchParams.get("limit"));
  if (entryLimit === null) {
    return Response.json(
      {
        status: "invalid_limit",
        message: `The limit must be a whole number from 1 to ${MAXIMUM_LEADERBOARD_PAGE_SIZE}.`,
      },
      { status: 400 },
    );
  }

  const leaderboardSnapshot = await loadLeaderboardSnapshot(entryLimit);

  return Response.json(leaderboardSnapshot, {
    // A board that is not connected or cannot be read is a service problem,
    // not an empty result, so clients can tell the two apart by status code.
    status: leaderboardSnapshot.status === "live" ? 200 : 503,
    headers: {
      // The board is the same for everyone, so a CDN may hold it briefly.
      "Cache-Control":
        leaderboardSnapshot.status === "live"
          ? "public, max-age=30, s-maxage=60"
          : "no-store",
    },
  });
}
