/**
 * File: src/components/copy-text-button.tsx
 * Purpose: Client button that copies a string to the clipboard and confirms
 * it inline. Used for the token contract address and for report links.
 */
"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CONFIRMATION_DURATION_MILLISECONDS = 2_000;

type CopyState = "idle" | "copied" | "failed";

interface CopyTextButtonProps {
  /** The exact text placed on the clipboard. */
  textToCopy: string;
  /** Visible label in the idle state. */
  label: string;
  /** Extra classes for layout; visual styling stays consistent. */
  className?: string;
}

export function CopyTextButton({
  textToCopy,
  label,
  className = "",
}: CopyTextButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimerReference = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Clear a pending reset if the component unmounts mid-confirmation.
  useEffect(() => {
    return () => {
      if (resetTimerReference.current) {
        clearTimeout(resetTimerReference.current);
      }
    };
  }, []);

  async function handleCopy() {
    let nextState: CopyState;
    try {
      // The Clipboard API rejects in insecure contexts and when the browser
      // denies permission, so the failure is surfaced instead of assumed away.
      await navigator.clipboard.writeText(textToCopy);
      nextState = "copied";
    } catch {
      nextState = "failed";
    }
    setCopyState(nextState);
    if (resetTimerReference.current) {
      clearTimeout(resetTimerReference.current);
    }
    resetTimerReference.current = setTimeout(
      () => setCopyState("idle"),
      CONFIRMATION_DURATION_MILLISECONDS,
    );
  }

  const visibleLabel =
    copyState === "copied"
      ? "Copied"
      : copyState === "failed"
        ? "Copy failed. Select it manually."
        : label;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink ${className}`}
    >
      {copyState === "copied" ? (
        <Check aria-hidden="true" className="size-4 text-gain" />
      ) : (
        <Copy aria-hidden="true" className="size-4 text-ink-faint" />
      )}
      <span aria-live="polite">{visibleLabel}</span>
    </button>
  );
}
