/**
 * File: src/lib/format/format-values.ts
 * Purpose: Display formatting for money, percentages, durations and dates.
 * All formatters are locale-fixed (en-US) and dates are rendered in UTC so
 * server and client output always match and no viewer time zone leaks into
 * shared reports.
 */

const MILLION = 1_000_000;

interface FormatUsdOptions {
  /** Prefix positive values with "+". Negative values always carry "-". */
  showPositiveSign?: boolean;
}

/**
 * Formats a USD amount for scanning rather than accounting:
 * cents below $100, whole dollars up to $1M, compact notation above.
 */
export function formatUsd(
  amountUsd: number,
  { showPositiveSign = false }: FormatUsdOptions = {},
): string {
  const absoluteAmount = Math.abs(amountUsd);
  const isCompact = absoluteAmount >= MILLION;
  const fractionDigits = isCompact ? 2 : absoluteAmount < 100 ? 2 : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: isCompact ? "compact" : "standard",
    minimumFractionDigits: isCompact ? 0 : fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: showPositiveSign ? "exceptZero" : "auto",
  }).format(amountUsd);
}

export function formatPercent(
  valuePercent: number,
  fractionDigits = 1,
): string {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(valuePercent)}%`;
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value,
  );
}

/** Formats a hold time as the largest sensible unit, for example "3.4 hours". */
export function formatHoldDuration(durationSeconds: number): string {
  const secondsPerMinute = 60;
  const secondsPerHour = 3_600;
  const secondsPerDay = 86_400;

  const formatUnit = (value: number, singular: string): string => {
    const roundedValue =
      value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${roundedValue} ${singular}${roundedValue === 1 ? "" : "s"}`;
  };

  if (durationSeconds < secondsPerMinute) {
    return formatUnit(Math.max(0, durationSeconds), "second");
  }
  if (durationSeconds < secondsPerHour) {
    return formatUnit(durationSeconds / secondsPerMinute, "minute");
  }
  if (durationSeconds < secondsPerDay) {
    return formatUnit(durationSeconds / secondsPerHour, "hour");
  }
  return formatUnit(durationSeconds / secondsPerDay, "day");
}

/**
 * Formats a Unix-millisecond timestamp or ISO string as a UTC calendar date
 * ("Nov 15, 2026"). Returns null for missing or unparseable input.
 */
export function formatUtcDate(
  timestamp: number | string | null | undefined,
): string | null {
  if (timestamp === null || timestamp === undefined) {
    return null;
  }
  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parsedDate);
}
