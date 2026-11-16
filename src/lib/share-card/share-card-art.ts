/**
 * File: src/lib/share-card/share-card-art.ts
 * Purpose: Loads artwork as data URLs so it can be embedded in the generated
 * share cards.
 *
 * - Site card: src/assets/share-art/site.jpg (portrait, 3:4).
 * - Report cards: one square image per diagnosis tier in src/assets/tier-art,
 *   named after the tier key.
 *
 * To change the art for a status or for the site, replace its file (same
 * name and shape). No code change is needed: the share cards and the report
 * page both read these files.
 */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { TraumaTierKey } from "@/lib/scanner/types";

const TIER_ART_DIRECTORY = join(process.cwd(), "src", "assets", "tier-art");
const SITE_ART_PATH = join(
  process.cwd(),
  "src",
  "assets",
  "share-art",
  "site.jpg",
);

/**
 * One loader per tier with a literal file name. Spelling the names out (in
 * place of building them from the tier key) lets the build trace each file
 * into the serverless bundle.
 */
const TIER_ART_LOADERS: Record<TraumaTierKey, () => Promise<Buffer>> = {
  clinically_fine: () =>
    readFile(join(TIER_ART_DIRECTORY, "clinically_fine.jpg")),
  mild_bag_fatigue: () =>
    readFile(join(TIER_ART_DIRECTORY, "mild_bag_fatigue.jpg")),
  chronic_bagholder: () =>
    readFile(join(TIER_ART_DIRECTORY, "chronic_bagholder.jpg")),
  acute_rug_trauma: () =>
    readFile(join(TIER_ART_DIRECTORY, "acute_rug_trauma.jpg")),
  terminal_degeneracy: () =>
    readFile(join(TIER_ART_DIRECTORY, "terminal_degeneracy.jpg")),
};

/** Encoded artwork is kept per server process; the files never change at runtime. */
const tierArtDataUrlCache = new Map<TraumaTierKey, Promise<string>>();

/**
 * Returns the tier's artwork as a JPEG data URL, or null when the file cannot
 * be read. Callers render the card without art in that case, so a missing
 * image never breaks a share link.
 */
export async function loadTierArtDataUrl(
  tierKey: TraumaTierKey,
): Promise<string | null> {
  let dataUrlPromise = tierArtDataUrlCache.get(tierKey);
  if (!dataUrlPromise) {
    dataUrlPromise = TIER_ART_LOADERS[tierKey]().then(
      (imageBytes) => `data:image/jpeg;base64,${imageBytes.toString("base64")}`,
    );
    tierArtDataUrlCache.set(tierKey, dataUrlPromise);
  }

  try {
    return await dataUrlPromise;
  } catch (error) {
    // Drop the failed promise so a later request can try again.
    tierArtDataUrlCache.delete(tierKey);
    console.error("[share-card] could not load tier artwork", {
      tierKey,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

let siteArtDataUrlPromise: Promise<string> | null = null;

/**
 * Returns the site-wide share artwork as a JPEG data URL, or null when the
 * file cannot be read.
 */
export async function loadSiteShareArtDataUrl(): Promise<string | null> {
  if (!siteArtDataUrlPromise) {
    siteArtDataUrlPromise = readFile(SITE_ART_PATH).then(
      (imageBytes) => `data:image/jpeg;base64,${imageBytes.toString("base64")}`,
    );
  }
  try {
    return await siteArtDataUrlPromise;
  } catch (error) {
    siteArtDataUrlPromise = null;
    console.error("[share-card] could not load site artwork", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
