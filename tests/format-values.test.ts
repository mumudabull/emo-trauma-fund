/**
 * File: tests/format-values.test.ts
 * Purpose: Unit tests for the display formatters used across reports.
 */
import { describe, expect, it } from "vitest";
import {
  formatHoldDuration,
  formatPercent,
  formatUsd,
  formatUtcDate,
} from "@/lib/format/format-values";

describe("formatUsd", () => {
  it("shows cents below $100 and whole dollars above", () => {
    expect(formatUsd(12.5)).toBe("$12.50");
    expect(formatUsd(1234.56)).toBe("$1,235");
  });

  it("uses compact notation from one million", () => {
    expect(formatUsd(10_706_843.06)).toBe("$10.71M");
  });

  it("keeps the minus sign on losses", () => {
    expect(formatUsd(-35871.5)).toBe("-$35,872");
  });

  it("adds a plus sign only when asked", () => {
    expect(formatUsd(420, { showPositiveSign: true })).toBe("+$420");
    expect(formatUsd(-420, { showPositiveSign: true })).toBe("-$420");
    expect(formatUsd(0, { showPositiveSign: true })).toBe("$0.00");
  });
});

describe("formatPercent", () => {
  it("rounds to one decimal by default and drops trailing zeros", () => {
    expect(formatPercent(38.686)).toBe("38.7%");
    expect(formatPercent(50)).toBe("50%");
  });
});

describe("formatHoldDuration", () => {
  it("picks the largest sensible unit", () => {
    expect(formatHoldDuration(45)).toBe("45 seconds");
    expect(formatHoldDuration(90)).toBe("1.5 minutes");
    expect(formatHoldDuration(20_391)).toBe("5.7 hours");
    expect(formatHoldDuration(86_400)).toBe("1 day");
    expect(formatHoldDuration(86_400 * 12)).toBe("12 days");
  });
});

describe("formatUtcDate", () => {
  it("formats ISO strings and Unix milliseconds as a UTC date", () => {
    expect(formatUtcDate("2026-04-24T19:08:38.649Z")).toBe("Apr 24, 2026");
    expect(formatUtcDate(1738348560665)).toBe("Jan 31, 2025");
  });

  it("uses UTC even near midnight", () => {
    expect(formatUtcDate("2026-04-24T23:59:59.000Z")).toBe("Apr 24, 2026");
  });

  it("returns null for missing or invalid input", () => {
    expect(formatUtcDate(null)).toBeNull();
    expect(formatUtcDate("not a date")).toBeNull();
  });
});
