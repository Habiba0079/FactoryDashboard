import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cmToMeters,
  formatCurrency,
  formatMeters,
  formatNumber,
  toDateInput,
  today,
} from "./format";

describe("number formatting", () => {
  it.each([
    [0, "0"],
    [1234, "1,234"],
    [1234567, "1,234,567"],
    [1234.567, "1,234.57"],
    [0.5, "0.5"],
  ])("formatNumber(%s) = %s", (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });

  it("formatCurrency appends the currency name", () => {
    expect(formatCurrency(1500)).toBe("1,500 جنيه");
  });

  it("cmToMeters divides by 100", () => {
    expect(cmToMeters(15000)).toBe(150);
  });

  it("formatMeters converts and formats", () => {
    expect(formatMeters(15312)).toBe("153.12 متر");
  });
});

describe("today", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the local date as yyyy-MM-dd with zero padding", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 12, 0)); // 5 Jan 2026, local time
    expect(today()).toBe("2026-01-05");
  });

  it("uses the local day, not the UTC day, just after midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 5, 0, 30)); // 00:30 local on 5 Oct
    expect(today()).toBe("2026-10-05");
  });
});

describe("toDateInput", () => {
  it.each([
    ["2026-10-01", "2026-10-01"],
    ["2026-10-01T21:00:00.000Z", "2026-10-01"],
    ["", ""],
  ])("%j → %j", (value, expected) => {
    expect(toDateInput(value)).toBe(expected);
  });
});
