/**
 * File: src/app/icon.tsx
 * Purpose: Generates the site favicon: the "ETF" monogram on the brand's ink
 * color. Generated from code so the icon always matches the wordmark.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const geistMonoMedium = await readFile(
    join(
      process.cwd(),
      "src",
      "assets",
      "fonts",
      "geist-mono-latin-500-normal.woff",
    ),
  );

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        borderRadius: 12,
        backgroundColor: "#15181c",
        color: "#f7f7f4",
        fontFamily: "Geist Mono",
        fontSize: 26,
        letterSpacing: 1,
      }}
    >
      ETF
    </div>,
    {
      ...size,
      // The icon only changes on deploy, so let browsers and CDNs keep it.
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
      },
      fonts: [
        {
          name: "Geist Mono",
          data: geistMonoMedium,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}
