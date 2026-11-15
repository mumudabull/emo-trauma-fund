/**
 * File: vitest.config.mts
 * Purpose: Unit test configuration. Tests cover the pure logic (scoring,
 * provider response mapping, address validation, rate limiting, formatting)
 * and run in a plain Node environment without Next.js.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors the "@/*" path alias from tsconfig.json.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
