/**
 * File: src/app/opengraph-image.tsx
 * Purpose: Default social share image for the site (home page and any route
 * without its own image). Rendered as a PNG from the shared card layout.
 */
import { siteConfig } from "@/lib/config/site-config";
import {
  renderBrandShareCard,
  SHARE_CARD_CONTENT_TYPE,
  SHARE_CARD_SIZE,
} from "@/lib/share-card/render-share-card";

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_CONTENT_TYPE;

export default function OpenGraphImage() {
  return renderBrandShareCard();
}
