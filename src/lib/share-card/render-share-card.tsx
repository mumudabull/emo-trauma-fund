/**
 * File: src/lib/share-card/render-share-card.tsx
 * Purpose: Renders the 1200x630 social share cards as PNG images: a brand
 * card for the site and a report card showing a wallet's trauma score and
 * diagnosis. Used by the opengraph-image routes.
 *
 * The markup here is rendered by Satori, not a browser. Satori supports only
 * flexbox and a subset of CSS, and every element with more than one child
 * must set display: flex. Styles are therefore inline and self-contained.
 */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/config/site-config";
import { TRAUMA_TIERS } from "@/lib/scanner/trauma-score";
import type { TraumaAssessment } from "@/lib/scanner/types";
import { truncateWalletAddress } from "@/lib/solana/wallet-address";

export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;
export const SHARE_CARD_CONTENT_TYPE = "image/png";

/**
 * Cache policies for generated images. Without an explicit header these
 * routes are re-rendered on every request.
 *
 * - Brand card: identical for everyone and only changes on deploy.
 * - Report card: follows the scan cache, so a card never outlives its data
 *   by more than a few minutes.
 * - Fallback card on a report URL: never stored, because the same URL should
 *   show the real score as soon as the scan succeeds.
 */
export const SHARE_CARD_CACHE_CONTROL = {
  brand: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  report: "public, max-age=300, s-maxage=600, stale-while-revalidate=600",
  fallback: "no-store",
} as const;

export type ShareCardCachePolicy = keyof typeof SHARE_CARD_CACHE_CONTROL;

/** Mirrors the site's design tokens; Satori cannot read CSS variables. */
const CARD_COLORS = {
  paper: "#fdf8f9",
  surface: "#ffffff",
  ink: "#1d1519",
  inkSoft: "#5b4b53",
  inkFaint: "#8f7d85",
  line: "#f1e3e8",
} as const;

/** Severity tints for the five diagnosis bands, faintest first. */
const BAND_FILL_COLORS = [
  "rgba(176, 56, 47, 0.12)",
  "rgba(176, 56, 47, 0.28)",
  "rgba(176, 56, 47, 0.46)",
  "rgba(176, 56, 47, 0.66)",
  "rgba(176, 56, 47, 0.9)",
] as const;

const FONT_DIRECTORY = join(process.cwd(), "src", "assets", "fonts");

interface ShareCardFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600;
  style: "normal";
}

/**
 * Font files are read once per server process and reused. Satori accepts
 * ttf, otf and woff (not woff2), which is why the .woff copies are bundled.
 */
let shareCardFontsPromise: Promise<ShareCardFont[]> | null = null;

function loadShareCardFonts(): Promise<ShareCardFont[]> {
  if (!shareCardFontsPromise) {
    shareCardFontsPromise = Promise.all([
      readFile(join(FONT_DIRECTORY, "instrument-serif-latin-400-normal.woff")),
      readFile(join(FONT_DIRECTORY, "geist-sans-latin-400-normal.woff")),
      readFile(join(FONT_DIRECTORY, "geist-sans-latin-600-normal.woff")),
      readFile(join(FONT_DIRECTORY, "geist-mono-latin-500-normal.woff")),
    ]).then(
      ([instrumentSerif, geistRegular, geistSemiBold, geistMonoMedium]) => [
        {
          name: "Instrument Serif",
          data: instrumentSerif,
          weight: 400,
          style: "normal",
        },
        { name: "Geist", data: geistRegular, weight: 400, style: "normal" },
        { name: "Geist", data: geistSemiBold, weight: 600, style: "normal" },
        {
          name: "Geist Mono",
          data: geistMonoMedium,
          weight: 500,
          style: "normal",
        },
      ],
    );
    // A failed read must not be cached, or every later card would fail too.
    shareCardFontsPromise.catch(() => {
      shareCardFontsPromise = null;
    });
  }
  return shareCardFontsPromise;
}

/** Host name shown in the card footer, for example "emotionaltrauma.fund". */
function resolveDisplayHost(): string {
  try {
    return new URL(siteConfig.siteUrl).host;
  } catch {
    return siteConfig.name;
  }
}

function CardHeader({ contextLabel }: { contextLabel: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 44,
            padding: "0 12px",
            border: `2px solid ${CARD_COLORS.ink}`,
            borderRadius: 7,
            fontFamily: "Geist Mono",
            fontSize: 18,
            letterSpacing: 3,
            color: CARD_COLORS.ink,
          }}
        >
          ETF
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Instrument Serif",
            fontSize: 38,
            color: CARD_COLORS.ink,
          }}
        >
          {siteConfig.name}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Geist Mono",
          fontSize: 18,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: CARD_COLORS.inkFaint,
        }}
      >
        {contextLabel}
      </div>
    </div>
  );
}

function CardFooter({ leftText }: { leftText: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingTop: 22,
        borderTop: `1px solid ${CARD_COLORS.line}`,
        fontFamily: "Geist Mono",
        fontSize: 18,
        letterSpacing: 1,
        color: CARD_COLORS.inkFaint,
      }}
    >
      <div style={{ display: "flex" }}>{leftText}</div>
      <div style={{ display: "flex" }}>{resolveDisplayHost()}</div>
    </div>
  );
}

function CardFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "56px 64px",
        backgroundColor: CARD_COLORS.paper,
        fontFamily: "Geist",
        color: CARD_COLORS.ink,
      }}
    >
      {children}
    </div>
  );
}

/** Site-wide card used for the home page and as the fallback for reports. */
export async function renderBrandShareCard(
  options: {
    contextLabel?: string;
    supportingLine?: string;
    cachePolicy?: ShareCardCachePolicy;
  } = {},
): Promise<ImageResponse> {
  const {
    contextLabel = `${siteConfig.ticker} on ${siteConfig.chainName}`,
    supportingLine = "Paste a Solana wallet. Get a trauma score and a report you can share.",
    cachePolicy = "brand",
  } = options;

  return new ImageResponse(
    <CardFrame>
      <CardHeader contextLabel={contextLabel} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            maxWidth: 980,
            fontFamily: "Instrument Serif",
            fontSize: 96,
            lineHeight: 1,
            color: CARD_COLORS.ink,
          }}
        >
          {siteConfig.tagline}
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: 820,
            fontSize: 30,
            lineHeight: 1.35,
            color: CARD_COLORS.inkSoft,
          }}
        >
          {supportingLine}
        </div>
      </div>
      <CardFooter leftText="Loss scanner" />
    </CardFrame>,
    {
      ...SHARE_CARD_SIZE,
      fonts: await loadShareCardFonts(),
      headers: { "Cache-Control": SHARE_CARD_CACHE_CONTROL[cachePolicy] },
    },
  );
}

/** Card for a diagnosed wallet: score, diagnosis and the severity scale. */
export async function renderReportShareCard(
  walletAddress: string,
  assessment: TraumaAssessment,
): Promise<ImageResponse> {
  // Width of the scale in pixels: card width minus horizontal padding.
  const scaleWidth = SHARE_CARD_SIZE.width - 64 * 2;
  const markerOffset = (assessment.score / 100) * scaleWidth;

  return new ImageResponse(
    <CardFrame>
      <CardHeader contextLabel="Patient report" />

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Geist Mono",
              fontSize: 18,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: CARD_COLORS.inkFaint,
            }}
          >
            Trauma score
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Instrument Serif",
                fontSize: 250,
                lineHeight: 0.85,
                color: CARD_COLORS.ink,
              }}
            >
              {String(assessment.score)}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Geist Mono",
                fontSize: 26,
                color: CARD_COLORS.inkFaint,
              }}
            >
              / 100
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 10,
            maxWidth: 620,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Geist Mono",
              fontSize: 18,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: CARD_COLORS.inkFaint,
            }}
          >
            Diagnosis
          </div>
          <div
            style={{
              display: "flex",
              textAlign: "right",
              fontFamily: "Instrument Serif",
              fontSize: 78,
              lineHeight: 1,
              color: CARD_COLORS.ink,
            }}
          >
            {assessment.tier.name}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Geist Mono",
              fontSize: 22,
              color: CARD_COLORS.inkSoft,
            }}
          >
            {`Wallet ${truncateWalletAddress(walletAddress, 5)}`}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Severity scale with a marker at the wallet's score. */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: scaleWidth,
            height: 34,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", width: "100%", height: 12, gap: 3 }}>
            {TRAUMA_TIERS.map((tier, tierIndex) => (
              <div
                key={tier.key}
                style={{
                  display: "flex",
                  flexGrow: tier.maximumScore - tier.minimumScore + 1,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: BAND_FILL_COLORS[tierIndex],
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: Math.max(0, Math.min(scaleWidth - 4, markerOffset - 2)),
              width: 4,
              height: 34,
              borderRadius: 2,
              backgroundColor: CARD_COLORS.ink,
            }}
          />
        </div>
        <CardFooter leftText={`${siteConfig.ticker} loss scanner`} />
      </div>
    </CardFrame>,
    {
      ...SHARE_CARD_SIZE,
      fonts: await loadShareCardFonts(),
      headers: { "Cache-Control": SHARE_CARD_CACHE_CONTROL.report },
    },
  );
}
