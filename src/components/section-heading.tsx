/**
 * File: src/components/section-heading.tsx
 * Purpose: Shared heading block for landing-page sections: a short monospace
 * label, a serif title and an optional lead paragraph, so every section opens
 * with the same rhythm.
 */
import type { ReactNode } from "react";

interface SectionHeadingProps {
  /** Short category label above the title. */
  label: string;
  title: string;
  /** Id placed on the h2 so the enclosing section can reference it. */
  titleId: string;
  /** Optional supporting paragraph. */
  children?: ReactNode;
  /** Element rendered beside the label, such as a status pill. */
  labelAccessory?: ReactNode;
}

export function SectionHeading({
  label,
  title,
  titleId,
  children,
  labelAccessory,
}: SectionHeadingProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          {label}
        </p>
        {labelAccessory}
      </div>
      <h2
        id={titleId}
        className="font-display text-4xl leading-[1.05] text-ink sm:text-5xl"
      >
        {title}
      </h2>
      {children ? (
        <p className="text-base leading-relaxed text-ink-soft sm:text-lg">
          {children}
        </p>
      ) : null}
    </div>
  );
}
