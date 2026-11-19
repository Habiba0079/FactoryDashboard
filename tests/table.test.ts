import { describe, expect, it } from "vitest";
import { compareNewest, matchesMonth } from "../src/utils/table";

describe("compareNewest", () => {
  it("puts the newest date first", () => {
    const rows = [
      { id: "a", date: "2026-09-01" },
      { id: "b", date: "2026-10-01" },
      { id: "c", date: "2026-08-01" },
    ];
    expect([...rows].sort(compareNewest).map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("puts the most recently created row first on the same day", () => {
    const rows = [
      { id: "M-1700000000001", date: "2026-10-01" },
      { id: "M-1700000000009", date: "2026-10-01" },
    ];
    expect([...rows].sort(compareNewest).map((r) => r.id)).toEqual(["M-1700000000009", "M-1700000000001"]);
  });
});

describe("matchesMonth", () => {
  it("matches every date when no month is chosen", () => {
    expect(matchesMonth("2026-10-15", "")).toBe(true);
  });

  it("matches only dates inside the chosen month", () => {
    expect(matchesMonth("2026-10-15", "2026-10")).toBe(true);
    expect(matchesMonth("2026-11-01", "2026-10")).toBe(false);
    expect(matchesMonth("2025-10-15", "2026-10")).toBe(false);
  });

  it("works with full ISO strings", () => {
    expect(matchesMonth("2026-10-15T10:00:00.000Z", "2026-10")).toBe(true);
  });
});
