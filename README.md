<!--
  File: README.md
  Purpose: Project overview, setup, configuration, architecture and roadmap
  for the Emotional Trauma Fund ($ETF) loss scanner.
-->

# Emotional Trauma Fund ($ETF)

A loss scanner for Solana. Paste a wallet address and the site reviews its
trading history, totals the damage, and issues a trauma score from 0 to 100
with a diagnosis, a report page and a share card for X.

This repository is phase 1 of the roadmap (the scanner and website). The
claims desk and the Telegram group therapy bot are phases 2 and 3.

## Stack

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS
4, zod, lucide-react, vitest. Wallet PnL data comes from the Solana Tracker
Data API (PnL V2).

## Getting started

```bash
npm install
cp .env.example .env.local   # then set SOLANA_TRACKER_API_KEY
npm run dev
```

Open http://localhost:3000. Without an API key the site still runs; report
pages show a "scanner is not connected" notice instead of results.

## Configuration

| Variable                     | Required    | Purpose                                                    |
| ---------------------------- | ----------- | ---------------------------------------------------------- |
| `SOLANA_TRACKER_API_KEY`     | For scans   | Solana Tracker Data API key. Server-only.                  |
| `NEXT_PUBLIC_SITE_URL`       | Recommended | Public origin, used in share links and social cards.       |
| `NEXT_PUBLIC_TOKEN_MINT`     | Optional    | $ETF mint address. Shows the contract block in the footer. |
| `NEXT_PUBLIC_BUY_URL`        | Optional    | Shows "Buy $ETF" links.                                    |
| `NEXT_PUBLIC_X_URL`          | Optional    | Shows the X link in the footer.                            |
| `NEXT_PUBLIC_TELEGRAM_URL`   | Optional    | Shows the Telegram link in the footer.                     |
| `SCAN_RATE_LIMIT_PER_MINUTE` | Optional    | Scans per client IP per minute. Default 12.                |
| `SOLANA_TRACKER_BASE_URL`    | Optional    | Provider origin override.                                  |

Optional links are hidden while their variable is empty, so nothing renders
as a placeholder before launch.

## Scripts

| Command                       | What it does                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                 | Development server.                                                            |
| `npm run build` / `npm start` | Production build and server.                                                   |
| `npm test`                    | Unit tests (scoring, provider mapping, validation, rate limiting, formatting). |
| `npm run typecheck`           | Generates route types and runs the TypeScript compiler.                        |
| `npm run lint`                | ESLint.                                                                        |
| `npm run format`              | Prettier.                                                                      |

## Routes

| Route                              | Purpose                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `/`                                | Landing page with the scan form, methodology, fund, roadmap and FAQ. |
| `/report/{wallet}`                 | Report for one wallet. The scan streams in on the server.            |
| `/report/{wallet}/opengraph-image` | Share card (PNG) with the score and diagnosis.                       |
| `/api/scan/{wallet}`               | The same scan as JSON, for the Telegram bot and other clients.       |

## Architecture

```
src/
  app/                         routes, layouts, generated images
  components/                  UI (landing/, report/, shared)
  lib/
    config/                    public site config and validated server config
    providers/solana-tracker/  HTTP client and zod response schemas
    scanner/                   domain types, profile builder, trauma score, scan orchestration
    rate-limit/                sliding-window limiter and request guard
    share-card/                share text and social card rendering
    format/                    money, percent, duration and date formatting
    solana/                    wallet address validation
  assets/fonts/                self-hosted fonts (SIL Open Font License)
tests/                         vitest unit tests and provider fixtures
```

How a scan runs:

1. The form validates the address in the browser and navigates to
   `/report/{wallet}`.
2. The server validates the address again, applies the per-client rate limit,
   then calls `scanWallet`.
3. `scanWallet` fetches the wallet's PnL summary and its 100 worst losing
   positions from Solana Tracker, maps them to a provider-agnostic
   `WalletLossProfile`, and scores it.
4. The result is cached per wallet (`use cache: remote`): about ten minutes for
   completed scans and one minute for provider failures. The page, the share
   card and the API all read the same cached result, so one shared link costs
   two provider requests in total.

Adding a second chain or data source means writing one adapter that returns a
`WalletLossProfile`. Scoring and UI do not change.

## Trauma score

Five weighted components, defined in `src/lib/scanner/trauma-score.ts`. The
methodology section of the site renders from the same definitions.

| Component                                       | Weight | Scale                         |
| ----------------------------------------------- | ------ | ----------------------------- |
| Net damage (negative total PnL)                 | 30     | Logarithmic, $50 to $100,000  |
| Losing bags (sum of worst 100 losing positions) | 25     | Logarithmic, $100 to $250,000 |
| Deepest wound (worst single position)           | 15     | Logarithmic, $25 to $25,000   |
| Loss rate (share of closed positions lost)      | 15     | Linear, 35% to 85%            |
| Wipeouts (share that lost over half)            | 15     | Linear, 0% to 35%             |

Wallets with fewer than 5 closed positions are not scored. Wallets the
provider labels as bots, arbitrage, exchanges or pools are scored but flagged
as not eligible for claims.

## Deployment

The app runs on any Node.js 20.9+ host.

- **Vercel**: import the repository and set the environment variables. The
  platform supplies the shared cache used by `use cache: remote`.
- **Single server (VPS, Replit, container)**: `npm run build && npm start`
  behind a reverse proxy that sets `x-forwarded-for`. The scan cache and rate
  limiter live in process memory, which is exact for one process.

Rate limiting is per process. On serverless platforms each warm instance keeps
its own window, so the scan cache is the main protection for provider quota
there. For a strict global limit, back `SlidingWindowRateLimiter` with Redis.

Provider quota: the Solana Tracker free plan allows 2,500 requests a month,
which is roughly 1,250 uncached scans. Pick a paid plan before a public launch.

## Verification status

Unit tests, type checks, lint and the production build pass. The full scan
path (page, share card and API) was exercised end to end against a local
stand-in that serves responses in the provider's documented shape. It has not
yet been run against the live Solana Tracker API, because that needs a key.
On the first live scan, confirm in particular that the positions request
(`filter=losing&sort=pnl&direction=asc`) is accepted; positions are re-sorted
locally either way.

## Roadmap

1. **Loss scanner** (this repository): wallet scan, trauma score, report page,
   share card, JSON API.
2. **Claims desk**: wallet verification by signature, scoring fixed to a
   published snapshot date, weekly discretionary airdrops from creator fees to
   top-scoring $ETF holders, capped per wallet, with a public payout ledger.
3. **Group therapy on Telegram**: a bot that scans wallets in chat (via
   `/api/scan/{wallet}`), posts rug and liquidation alerts as intake notices,
   and runs a weekly worst-trade leaderboard.

## Notes

$ETF is a memecoin. The name is a joke about the state of the market. It is
not an exchange-traded fund, a security or an investment product, and trauma
scores are entertainment based on public on-chain data.

Fonts: Geist and Geist Mono (Vercel) and Instrument Serif, all under the SIL
Open Font License. License texts are in `src/assets/fonts/`.
