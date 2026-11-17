/**
 * File: src/lib/leaderboard/leaderboard-store.ts
 * Purpose: Persistence for the leaderboard, on Upstash Redis over its REST
 * API (the Redis offered through the Vercel Marketplace). Records a wallet's
 * entry after a fresh scan and reads the top of the board.
 *
 * Storage layout:
 * - Sorted set RANKING_KEY: member = wallet address, score = rank value.
 *   A sorted set keeps the board ordered on write, so reading the top N is
 *   one command however many wallets are ranked.
 * - Hash RECORDS_KEY: field = wallet address, value = JSON record.
 *
 * When no database is configured every function degrades quietly: nothing
 * is recorded and reads report "not_configured", so the rest of the site is
 * unaffected.
 */
import "server-only";
import { Redis } from "@upstash/redis";
import { cacheLife } from "next/cache";
import { getServerConfig } from "@/lib/config/server-config";
import {
  calculateRankValue,
  parseLeaderboardRecord,
  rankLeaderboardRecords,
  serializeLeaderboardRecord,
  type LeaderboardRecord,
  type LeaderboardSnapshot,
} from "./leaderboard-entry";

/** The "v1" segment allows a clean reset if the stored shape ever changes. */
const RANKING_KEY = "etf:leaderboard:v1:ranking";
const RECORDS_KEY = "etf:leaderboard:v1:records";

/**
 * Wallets kept on the board. Lower-ranked wallets beyond this are dropped on
 * write, which bounds storage no matter how many wallets get scanned.
 */
const MAXIMUM_RANKED_WALLETS = 1_000;

/** Most entries a single read may request. */
export const MAXIMUM_LEADERBOARD_PAGE_SIZE = 100;

/** How long a read of the board is reused before Redis is asked again. */
const LEADERBOARD_CACHE_LIFE = {
  stale: 30,
  revalidate: 60,
  expire: 300,
} as const;

let cachedRedisClient: { client: Redis; restUrl: string } | null = null;

function getRedisClient(): Redis | null {
  const { leaderboardStore } = getServerConfig();
  if (!leaderboardStore) {
    return null;
  }
  // Reuse one client per process, and rebuild it if the URL ever changes.
  if (cachedRedisClient?.restUrl !== leaderboardStore.restUrl) {
    cachedRedisClient = {
      restUrl: leaderboardStore.restUrl,
      client: new Redis({
        url: leaderboardStore.restUrl,
        token: leaderboardStore.restToken,
        // Wallet addresses are strings that can look numeric (the System
        // Program address is all ones). The client's automatic JSON parsing
        // would turn those into imprecise numbers, so values are kept as
        // strings and parsed explicitly here.
        automaticDeserialization: false,
      }),
    };
  }
  return cachedRedisClient.client;
}

export function isLeaderboardConfigured(): boolean {
  return getServerConfig().leaderboardStore !== null;
}

/**
 * Writes or updates a wallet's entry. A rescan of the same wallet replaces
 * its previous entry, so each wallet appears once with its latest score.
 *
 * Failures are logged and swallowed: the leaderboard is a side feature and
 * must never break a scan.
 */
export async function recordLeaderboardEntry(
  record: LeaderboardRecord,
): Promise<void> {
  const redisClient = getRedisClient();
  if (!redisClient) {
    return;
  }

  try {
    const writePipeline = redisClient.pipeline();
    writePipeline.zadd(RANKING_KEY, {
      score: calculateRankValue(record.score, record.combinedLossUsd),
      member: record.walletAddress,
    });
    writePipeline.hset(RECORDS_KEY, {
      [record.walletAddress]: serializeLeaderboardRecord(record),
    });
    await writePipeline.exec();

    // Trim everything ranked below the cap. Ranks are ascending in a sorted
    // set, so indexes 0 to -(cap + 1) are exactly the overflow, and the range
    // is empty while the board is under the cap.
    const overflowWallets = await redisClient.zrange<string[]>(
      RANKING_KEY,
      0,
      -(MAXIMUM_RANKED_WALLETS + 1),
    );
    if (overflowWallets.length > 0) {
      const trimPipeline = redisClient.pipeline();
      trimPipeline.zrem(RANKING_KEY, ...overflowWallets);
      trimPipeline.hdel(RECORDS_KEY, ...overflowWallets);
      await trimPipeline.exec();
    }
  } catch (error) {
    console.error("[leaderboard] could not record entry", {
      walletAddress: record.walletAddress,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Picks one wallet's stored value out of an HMGET reply.
 *
 * With automatic deserialization turned off the client returns the raw Redis
 * reply, an array in the order the fields were requested. With it on, the
 * client returns an object keyed by field. Both shapes are handled so the
 * store keeps working if that client setting is ever changed.
 */
function readStoredRecord(
  hmgetReply: unknown,
  walletAddress: string,
  walletIndex: number,
): unknown {
  if (Array.isArray(hmgetReply)) {
    return hmgetReply[walletIndex];
  }
  if (hmgetReply !== null && typeof hmgetReply === "object") {
    return (hmgetReply as Record<string, unknown>)[walletAddress];
  }
  return undefined;
}

/**
 * Reads the top of the board straight from Redis.
 * Throws on connection or protocol errors; the cached wrapper handles them.
 */
async function readLeaderboardFromStore(
  redisClient: Redis,
  entryLimit: number,
): Promise<LeaderboardSnapshot> {
  const [topWallets, rankedWalletCount] = await Promise.all([
    redisClient.zrange<string[]>(RANKING_KEY, 0, entryLimit - 1, {
      rev: true,
    }),
    redisClient.zcard(RANKING_KEY),
  ]);

  if (topWallets.length === 0) {
    return { status: "live", entries: [], rankedWalletCount: 0 };
  }

  const storedRecords: unknown = await redisClient.hmget(
    RECORDS_KEY,
    ...topWallets,
  );

  // Keep the sorted-set order; skip wallets whose record is missing or
  // invalid so a single bad row cannot take the board down.
  const orderedRecords: LeaderboardRecord[] = [];
  topWallets.forEach((walletAddress, walletIndex) => {
    const record = parseLeaderboardRecord(
      readStoredRecord(storedRecords, walletAddress, walletIndex),
    );
    if (record) {
      orderedRecords.push(record);
    }
  });

  return {
    status: "live",
    entries: rankLeaderboardRecords(orderedRecords),
    rankedWalletCount: Number(rankedWalletCount),
  };
}

/**
 * Cached read, keyed by the limit. Sixty seconds of reuse means a busy page
 * costs one Redis read a minute instead of one per visitor.
 */
async function loadCachedLeaderboard(
  entryLimit: number,
): Promise<LeaderboardSnapshot> {
  "use cache: remote";
  cacheLife(LEADERBOARD_CACHE_LIFE);

  const redisClient = getRedisClient();
  if (!redisClient) {
    return { status: "not_configured" };
  }

  try {
    return await readLeaderboardFromStore(redisClient, entryLimit);
  } catch (error) {
    console.error("[leaderboard] could not read the board", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { status: "unavailable" };
  }
}

/** Returns the top `entryLimit` entries, highest trauma score first. */
export async function loadLeaderboardSnapshot(
  entryLimit: number,
): Promise<LeaderboardSnapshot> {
  // Checked outside the cached function so that connecting a database takes
  // effect on the next request instead of after a cached result expires.
  if (!isLeaderboardConfigured()) {
    return { status: "not_configured" };
  }
  const boundedLimit = Math.min(
    Math.max(1, Math.floor(entryLimit)),
    MAXIMUM_LEADERBOARD_PAGE_SIZE,
  );
  return loadCachedLeaderboard(boundedLimit);
}
