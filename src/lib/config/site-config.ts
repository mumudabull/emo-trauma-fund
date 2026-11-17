/**
 * File: src/lib/config/site-config.ts
 * Purpose: Public, browser-safe site configuration (brand strings, token and
 * social links). The X and Telegram channels have defaults in code. The token
 * address and buy link come only from NEXT_PUBLIC_* environment variables and
 * stay undefined when unset, so the UI hides them instead of rendering a
 * placeholder.
 */

/**
 * Returns the value only when it is a well-formed http(s) URL.
 * Anything else (empty string, malformed value, javascript: URL) is dropped.
 */
function readOptionalHttpUrl(rawValue: string | undefined): string | undefined {
  const trimmedValue = rawValue?.trim();
  if (!trimmedValue) {
    return undefined;
  }
  try {
    const parsedUrl = new URL(trimmedValue);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return undefined;
    }
    return parsedUrl.toString();
  } catch {
    return undefined;
  }
}

function readOptionalText(rawValue: string | undefined): string | undefined {
  const trimmedValue = rawValue?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

/**
 * Resolves the canonical origin used for metadata and share links.
 * Order: explicit NEXT_PUBLIC_SITE_URL, then the Vercel production domain,
 * then localhost for development.
 */
function resolveSiteUrl(): string {
  const explicitSiteUrl = readOptionalHttpUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicitSiteUrl) {
    return explicitSiteUrl.replace(/\/$/, "");
  }
  const vercelProductionDomain = readOptionalText(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );
  if (vercelProductionDomain) {
    return `https://${vercelProductionDomain}`;
  }
  return "http://localhost:3000";
}

/**
 * The project's official channels. They are defaults in code so the links
 * work on every deployment without extra setup; NEXT_PUBLIC_X_URL and
 * NEXT_PUBLIC_TELEGRAM_URL override them if the accounts ever move.
 */
const DEFAULT_X_URL = "https://x.com/soltrauma";
const DEFAULT_TELEGRAM_URL = "https://t.me/emotionaltraumafund";

/**
 * Derives the "@handle" from an X profile URL, for use in share text and
 * card metadata. Returns undefined when the URL is not a plain profile link.
 */
function extractXHandle(xProfileUrl: string): string | undefined {
  try {
    const parsedUrl = new URL(xProfileUrl);
    const isXHost = /^(www\.)?(x|twitter)\.com$/.test(parsedUrl.hostname);
    const [firstPathSegment] = parsedUrl.pathname.split("/").filter(Boolean);
    // X handles are 1 to 15 letters, digits or underscores.
    if (isXHost && firstPathSegment && /^\w{1,15}$/.test(firstPathSegment)) {
      return `@${firstPathSegment}`;
    }
  } catch {
    // Fall through: an unparseable URL has no handle.
  }
  return undefined;
}

const resolvedXUrl =
  readOptionalHttpUrl(process.env.NEXT_PUBLIC_X_URL) ?? DEFAULT_X_URL;

// NEXT_PUBLIC_* variables must be referenced as full static property accesses
// so the bundler can inline them into client code.
export const siteConfig = {
  name: "Emotional Trauma Fund",
  ticker: "$ETF",
  chainName: "Solana",
  tagline: "The fund for everything the market did to you.",
  description:
    "Paste a Solana wallet. The Emotional Trauma Fund reviews its trading history, totals the damage and issues a trauma score with a report you can share.",
  siteUrl: resolveSiteUrl(),
  tokenMintAddress: readOptionalText(process.env.NEXT_PUBLIC_TOKEN_MINT),
  buyUrl: readOptionalHttpUrl(process.env.NEXT_PUBLIC_BUY_URL),
  xUrl: resolvedXUrl,
  /** The X handle with its leading "@", for example "@soltrauma". */
  xHandle: extractXHandle(resolvedXUrl),
  telegramUrl:
    readOptionalHttpUrl(process.env.NEXT_PUBLIC_TELEGRAM_URL) ??
    DEFAULT_TELEGRAM_URL,
} as const;

/** Explorer links are centralised here so the explorer can be swapped once. */
export function buildWalletExplorerUrl(walletAddress: string): string {
  return `https://solscan.io/account/${encodeURIComponent(walletAddress)}`;
}

export function buildTokenExplorerUrl(tokenMintAddress: string): string {
  return `https://solscan.io/token/${encodeURIComponent(tokenMintAddress)}`;
}

export function buildReportPath(walletAddress: string): string {
  return `/report/${encodeURIComponent(walletAddress)}`;
}

export function buildReportUrl(walletAddress: string): string {
  return `${siteConfig.siteUrl}${buildReportPath(walletAddress)}`;
}
