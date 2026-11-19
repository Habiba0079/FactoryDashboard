import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { WeekPoint } from "../src/utils/calculations";
import WeeklyChart from "../src/components/WeeklyChart";

const weeks: WeekPoint[] = [
  { weekStart: "2026-09-26", work: 3000, payments: 3000, net: 0 },
  { weekStart: "2026-10-03", work: 3025, payments: 0, net: 3025 },
  { weekStart: "2026-10-10", work: 0, payments: 500, net: -500 },
];

describe("WeeklyChart", () => {
  it("shows a message instead of an empty chart when there is no data", () => {
    render(<WeeklyChart data={[]} />);
    expect(screen.getByText("لا توجد بيانات كافية للرسم")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("draws one bar per week", () => {
    const { container } = render(<WeeklyChart data={weeks} />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
  });

  it("colors bars by the sign of the net: positive, negative, zero", () => {
    const { container } = render(<WeeklyChart data={weeks} />);
    const bars = [...container.querySelectorAll("rect")];
    expect(bars[0]).toHaveClass("bar-zero");
    expect(bars[1]).toHaveClass("bar-pos");
    expect(bars[2]).toHaveClass("bar-neg");
  });

  it("labels each week with its start day (month-day) and the net value", () => {
    render(<WeeklyChart data={weeks} />);
    expect(screen.getByText("09-26")).toBeInTheDocument();
    expect(screen.getByText("10-03")).toBeInTheDocument();
    expect(screen.getByText("3k")).toBeInTheDocument(); // 3025 → 3k
    expect(screen.getByText("-500")).toBeInTheDocument();
  });

  it("describes each week in a tooltip (work, payments, net)", () => {
    const { container } = render(<WeeklyChart data={weeks} />);
    const titles = [...container.querySelectorAll("title")].map((t) => t.textContent);
    expect(titles[1]).toContain("3,025 جنيه");
    expect(titles[2]).toContain("-500 جنيه");
  });

  it("is exposed to screen readers as an image with a label", () => {
    render(<WeeklyChart data={weeks} />);
    expect(screen.getByRole("img", { name: /الصافي الأسبوعي/ })).toBeInTheDocument();
  });
});
