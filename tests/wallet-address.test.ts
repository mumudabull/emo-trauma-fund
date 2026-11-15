/**
 * File: tests/wallet-address.test.ts
 * Purpose: Unit tests for Solana wallet address validation and truncation.
 */
import { describe, expect, it } from "vitest";
import {
  parseSolanaWalletAddress,
  truncateWalletAddress,
} from "@/lib/solana/wallet-address";

describe("parseSolanaWalletAddress", () => {
  it("accepts valid 32-byte public keys", () => {
    expect(
      parseSolanaWalletAddress("CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o"),
    ).toBe("CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o");
    // The System Program address: 32 zero bytes.
    expect(parseSolanaWalletAddress("11111111111111111111111111111111")).toBe(
      "11111111111111111111111111111111",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(
      parseSolanaWalletAddress(
        "  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\n",
      ),
    ).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  });

  it("rejects empty and short input", () => {
    expect(parseSolanaWalletAddress("")).toBeNull();
    expect(parseSolanaWalletAddress("abc")).toBeNull();
  });

  it("rejects EVM addresses and characters outside base58", () => {
    expect(
      parseSolanaWalletAddress("0x52908400098527886E0F7030069857D2E4169EE7"),
    ).toBeNull();
    // Contains "0", "O", "I" and "l", none of which exist in base58.
    expect(
      parseSolanaWalletAddress("0OIl1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o"),
    ).toBeNull();
  });

  it("rejects base58 strings of plausible length that are not 32 bytes", () => {
    // 32 base58 characters that decode to fewer than 32 bytes.
    expect(
      parseSolanaWalletAddress("22222222222222222222222222222222"),
    ).toBeNull();
  });

  it("rejects path traversal and URL-like input", () => {
    expect(parseSolanaWalletAddress("../../etc/passwd")).toBeNull();
    expect(parseSolanaWalletAddress("https://example.com/wallet")).toBeNull();
  });
});

describe("truncateWalletAddress", () => {
  it("keeps the first and last characters", () => {
    expect(
      truncateWalletAddress("CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o"),
    ).toBe("CyaE…a54o");
    expect(
      truncateWalletAddress("CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o", 6),
    ).toBe("CyaE1V…Hga54o");
  });

  it("returns short strings unchanged", () => {
    expect(truncateWalletAddress("abcdefgh")).toBe("abcdefgh");
  });
});
