/**
 * File: src/components/wallet-scan-form.tsx
 * Purpose: The scanner's entry point. Validates a pasted Solana address in
 * the browser with the same rules the server uses, then navigates to that
 * wallet's report page, where the scan itself runs on the server.
 */
"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { buildReportPath } from "@/lib/config/site-config";
import { parseSolanaWalletAddress } from "@/lib/solana/wallet-address";

interface WalletScanFormProps {
  /** Text on the submit button. */
  submitLabel?: string;
}

export function WalletScanForm({
  submitLabel = "Scan wallet",
}: WalletScanFormProps) {
  const router = useRouter();
  const inputId = useId();
  const validationMessageId = useId();
  const [walletInput, setWalletInput] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  // The transition stays pending until the report route has started
  // rendering, which drives the button's busy state.
  const [isNavigating, startNavigation] = useTransition();

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const walletAddress = parseSolanaWalletAddress(walletInput);
    if (!walletAddress) {
      setValidationMessage(
        walletInput.trim() === ""
          ? "Paste a Solana wallet address to scan."
          : "That is not a valid Solana wallet address. Addresses are 32 to 44 letters and numbers.",
      );
      return;
    }

    setValidationMessage(null);
    startNavigation(() => {
      router.push(buildReportPath(walletAddress));
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint"
      >
        Solana wallet address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          name="walletAddress"
          type="text"
          value={walletInput}
          onChange={(changeEvent) => {
            setWalletInput(changeEvent.target.value);
            if (validationMessage) {
              setValidationMessage(null);
            }
          }}
          placeholder="Paste an address"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={validationMessage ? true : undefined}
          aria-describedby={validationMessage ? validationMessageId : undefined}
          className="h-12 w-full min-w-0 flex-none rounded-md border border-line-strong bg-surface px-4 font-mono text-sm text-ink placeholder:font-sans placeholder:text-ink-faint transition-colors hover:border-ink-faint focus:border-accent aria-[invalid=true]:border-loss sm:flex-1"
        />
        <button
          type="submit"
          disabled={isNavigating}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-progress disabled:opacity-80"
        >
          {isNavigating ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 motion-safe:animate-spin"
              />
              Opening report
            </>
          ) : (
            <>
              {submitLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          )}
        </button>
      </div>
      {/* The live region is always mounted so screen readers announce changes. */}
      <p
        id={validationMessageId}
        role="alert"
        className="min-h-5 text-sm text-loss"
      >
        {validationMessage}
      </p>
    </form>
  );
}
