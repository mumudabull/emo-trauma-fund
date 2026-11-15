/**
 * File: src/lib/solana/wallet-address.ts
 * Purpose: Validation and display helpers for Solana wallet addresses. Shared
 * by the browser form and the server so both apply the same rules.
 */
import bs58 from "bs58";

/** Base58 alphabet, 32 to 44 characters: the textual shape of a Solana address. */
const SOLANA_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** A Solana public key is exactly 32 bytes once base58-decoded. */
const SOLANA_PUBLIC_KEY_BYTE_LENGTH = 32;

/**
 * Returns the trimmed address when it is a valid Solana public key, otherwise
 * null. The pattern check alone is not enough: some 32 to 44 character base58
 * strings decode to 31 or 33 bytes, so the decoded length is verified too.
 */
export function parseSolanaWalletAddress(rawInput: string): string | null {
  const candidateAddress = rawInput.trim();
  if (!SOLANA_ADDRESS_PATTERN.test(candidateAddress)) {
    return null;
  }
  try {
    const decodedBytes = bs58.decode(candidateAddress);
    return decodedBytes.length === SOLANA_PUBLIC_KEY_BYTE_LENGTH
      ? candidateAddress
      : null;
  } catch {
    return null;
  }
}

/** Shortens an address for display, for example "7xKX…gAsU". */
export function truncateWalletAddress(
  walletAddress: string,
  visibleCharacters = 4,
): string {
  if (walletAddress.length <= visibleCharacters * 2 + 1) {
    return walletAddress;
  }
  return `${walletAddress.slice(0, visibleCharacters)}…${walletAddress.slice(-visibleCharacters)}`;
}
