/**
 * File: src/lib/share-card/render-share-card.tsx
 * Purpose: Renders the 1200x630 social share cards as PNG images: a brand
 * card for the site and a report card showing a wallet's trauma score,
 * diagnosis and the artwork for that diagnosis. Used by the opengraph-image
 * routes.
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
import {
  loadSiteShareArtDataUrl,
  loadTierArtDataUrl,
} from "@/lib/share-card/share-card-art";
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

/** Horizontal padding of the text column, shared by layout maths below. */
const TEXT_COLUMN_PADDING_X = 52;

/** Width of the square artwork panel on report cards (full card height). */
const REPORT_ART_PANEL_WIDTH = SHARE_CARD_SIZE.height;

/** Width of the 3:4 artwork panel on the site card at full card height. */
const SITE_ART_PANEL_WIDTH = Math.round((SHARE_CARD_SIZE.height * 3) / 4);

function BrandLockup() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 40,
          padding: "0 11px",
          border: `2px solid ${CARD_COLORS.ink}`,
          borderRadius: 7,
          fontFamily: "Geist Mono",
          fontSize: 17,
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
          fontSize: 34,
          color: CARD_COLORS.ink,
        }}
      >
        {siteConfig.name}
      </div>
    </div>
  );
}

function CardLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "Geist Mono",
        fontSize: 17,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: CARD_COLORS.inkFaint,
      }}
    >
      {children}
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
        paddingTop: 18,
        borderTop: `1px solid ${CARD_COLORS.line}`,
        fontFamily: "Geist Mono",
        fontSize: 17,
        letterSpacing: 1,
        color: CARD_COLORS.inkFaint,
      }}
    >
      <div style={{ display: "flex" }}>{leftText}</div>
      <div style={{ display: "flex" }}>{resolveDisplayHost()}</div>
    </div>
  );
}

/**
 * Two-panel card: a text column on the left and, when artwork is available,
 * a full-height picture on the right. Without artwork the text column takes
 * the whole card, so a missing image file never breaks a share link.
 */
function CardLayout({
  artDataUrl,
  artPanelWidth,
  children,
}: {
  artDataUrl: string | null;
  artPanelWidth: number;
  children: ReactNode;
}) {
  const textColumnWidth = artDataUrl
    ? SHARE_CARD_SIZE.width - artPanelWidth
    : SHARE_CARD_SIZE.width;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: CARD_COLORS.paper,
        fontFamily: "Geist",
        color: CARD_COLORS.ink,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: textColumnWidth,
          height: "100%",
          padding: `44px ${TEXT_COLUMN_PADDING_X}px`,
        }}
      >
        {children}
      </div>
      {artDataUrl ? (
        // Satori renders plain img elements; next/image is not available here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artDataUrl}
          alt=""
          width={artPanelWidth}
          height={SHARE_CARD_SIZE.height}
          style={{ objectFit: "cover" }}
        />
      ) : null}
    </div>
  );
}

/** Site-wide card used for the home page and as the fallback for reports. */
export async function renderBrandShareCard(
  options: {
    contextLabel?: string;
    cachePolicy?: ShareCardCachePolicy;
  } = {},
): Promise<ImageResponse> {
  const {
    contextLabel = `${siteConfig.ticker} on ${siteConfig.chainName}`,
    cachePolicy = "brand",
  } = options;
  const [shareCardFonts, siteArtDataUrl] = await Promise.all([
    loadShareCardFonts(),
    loadSiteShareArtDataUrl(),
  ]);

  return new ImageResponse(
    <CardLayout
      artDataUrl={siteArtDataUrl}
      artPanelWidth={SITE_ART_PANEL_WIDTH}
    >
      <BrandLockup />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Instrument Serif",
            fontSize: 78,
            lineHeight: 1,
            color: CARD_COLORS.ink,
          }}
        >
          {siteConfig.tagline}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 27,
            lineHeight: 1.35,
            color: CARD_COLORS.inkSoft,
          }}
        >
          Paste a Solana wallet. Get a trauma score and a report you can share.
        </div>
      </div>
      <CardFooter leftText={contextLabel} />
    </CardLayout>,
    {
      ...SHARE_CARD_SIZE,
      fonts: shareCardFonts,
      headers: { "Cache-Control": SHARE_CARD_CACHE_CONTROL[cachePolicy] },
    },
  );
}

/**
 * Card for a diagnosed wallet: score, diagnosis, the severity scale and the
 * artwork that belongs to the wallet's diagnosis tier.
 */
export async function renderReportShareCard(
  walletAddress: string,
  assessment: TraumaAssessment,
): Promise<ImageResponse> {
  const [shareCardFonts, tierArtDataUrl] = await Promise.all([
    loadShareCardFonts(),
    loadTierArtDataUrl(assessment.tier.key),
  ]);

  // The scale spans the text column, so its width depends on whether the
  // artwork panel is present.
  const textColumnWidth = tierArtDataUrl
    ? SHARE_CARD_SIZE.width - REPORT_ART_PANEL_WIDTH
    : SHARE_CARD_SIZE.width;
  const scaleWidth = textColumnWidth - TEXT_COLUMN_PADDING_X * 2;
  const markerWidth = 4;
  const markerOffset = Math.max(
    0,
    Math.min(
      scaleWidth - markerWidth,
      (assessment.score / 100) * scaleWidth - markerWidth / 2,
    ),
  );

  return new ImageResponse(
    <CardLayout
      artDataUrl={tierArtDataUrl}
      artPanelWidth={REPORT_ART_PANEL_WIDTH}
    >
      <BrandLockup />

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <CardLabel>Trauma score</CardLabel>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Instrument Serif",
                fontSize: 196,
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
                fontSize: 24,
                color: CARD_COLORS.inkFaint,
              }}
            >
              / 100
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <CardLabel>Diagnosis</CardLabel>
          <div
            style={{
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 58,
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
              fontSize: 20,
              color: CARD_COLORS.inkSoft,
            }}
          >
            {`Wallet ${truncateWalletAddress(walletAddress, 5)}`}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Severity scale with a marker at the wallet's score. */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: scaleWidth,
            height: 30,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", width: "100%", height: 10, gap: 3 }}>
            {TRAUMA_TIERS.map((tier, tierIndex) => (
              <div
                key={tier.key}
                style={{
                  display: "flex",
                  flexGrow: tier.maximumScore - tier.minimumScore + 1,
                  height: 10,
                  borderRadius: 5,
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
              left: markerOffset,
              width: markerWidth,
              height: 30,
              borderRadius: 2,
              backgroundColor: CARD_COLORS.ink,
            }}
          />
        </div>
        <CardFooter leftText={`${siteConfig.ticker} loss scanner`} />
      </div>
    </CardLayout>,
    {
      ...SHARE_CARD_SIZE,
      fonts: shareCardFonts,
      headers: { "Cache-Control": SHARE_CARD_CACHE_CONTROL.report },
    },
  );
}
