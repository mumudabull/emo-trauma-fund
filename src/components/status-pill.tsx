/**
 * File: src/components/status-pill.tsx
 * Purpose: Small status label used for delivery states (Live, Next, Planned)
 * across the fact sheet, fund section and roadmap. State is carried by the
 * dot and the text together, never by color alone.
 */

export type StatusPillTone = "live" | "next" | "planned";

const TONE_CLASS_NAMES: Record<
  StatusPillTone,
  { container: string; dot: string }
> = {
  live: {
    container: "border-gain/25 bg-gain-soft text-gain",
    dot: "bg-gain",
  },
  next: {
    container: "border-accent/20 bg-accent-soft text-accent",
    dot: "bg-accent",
  },
  planned: {
    container: "border-line-strong bg-paper text-ink-soft",
    dot: "border border-ink-faint bg-transparent",
  },
};

interface StatusPillProps {
  tone: StatusPillTone;
  children: string;
}

export function StatusPill({ tone, children }: StatusPillProps) {
  const toneClassNames = TONE_CLASS_NAMES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] ${toneClassNames.container}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${toneClassNames.dot}`}
      />
      {children}
    </span>
  );
}
