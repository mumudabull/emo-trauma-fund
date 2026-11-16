/**
 * File: tests/share-art-files.test.ts
 * Purpose: Guards the artwork slots used by share cards and report pages.
 * Every diagnosis tier must have a square JPEG named after its key, and the
 * site card must have its artwork, so a renamed tier or a missing file fails
 * here instead of producing a share card without a picture.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TRAUMA_TIERS } from "@/lib/scanner/trauma-score";

const ASSETS_DIRECTORY = join(process.cwd(), "src", "assets");

/**
 * Reads width and height from a JPEG's start-of-frame segment. Enough for
 * baseline and progressive JPEGs, which is what the art pipeline produces.
 */
function readJpegDimensions(imageBytes: Buffer): {
  width: number;
  height: number;
} {
  // Skip the two-byte start-of-image marker, then walk the segments.
  let offset = 2;
  while (offset < imageBytes.length) {
    if (imageBytes[offset] !== 0xff) {
      throw new Error("Not a valid JPEG segment boundary.");
    }
    const marker = imageBytes[offset + 1];
    const segmentLength = imageBytes.readUInt16BE(offset + 2);
    // SOF0 to SOF15 carry the frame size, except the three non-frame markers.
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isStartOfFrame) {
      return {
        height: imageBytes.readUInt16BE(offset + 5),
        width: imageBytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + segmentLength;
  }
  throw new Error("No start-of-frame segment found.");
}

describe("share artwork files", () => {
  it.each(TRAUMA_TIERS.map((tier) => tier.key))(
    "has square artwork for the %s tier",
    async (tierKey) => {
      const imageBytes = await readFile(
        join(ASSETS_DIRECTORY, "tier-art", `${tierKey}.jpg`),
      );
      const { width, height } = readJpegDimensions(imageBytes);
      expect(width).toBe(height);
      expect(width).toBeGreaterThanOrEqual(630);
    },
  );

  it("has portrait 3:4 artwork for the site card", async () => {
    const imageBytes = await readFile(
      join(ASSETS_DIRECTORY, "share-art", "site.jpg"),
    );
    const { width, height } = readJpegDimensions(imageBytes);
    expect(width / height).toBeCloseTo(3 / 4, 2);
    expect(height).toBeGreaterThanOrEqual(630);
  });
});
