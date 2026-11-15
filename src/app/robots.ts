/**
 * File: src/app/robots.ts
 * Purpose: Generates robots.txt. Report pages are intentionally left
 * crawlable: social crawlers such as X's obey robots.txt, and blocking
 * /report/ here would stop share cards from rendering. Reports are kept out
 * of search indexes with a noindex meta tag instead.
 */
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    host: siteConfig.siteUrl,
  };
}
