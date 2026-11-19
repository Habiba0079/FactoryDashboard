import { describe, expect, it } from "vitest";
import { makeModel, makePayment } from "../test/factories";
import {
  calculateBalance,
  calculateSummary,
  calculateTotalFabric,
  calculateTotalPrice,
  groupByWeek,
  hasDataAfter,
  lastDayOfMonth,
  selectPeriod,
  sortModelsByDate,
  summarizeUpTo,
  weekStart,
} from "./calculations";

describe("simple totals", () => {
  it("calculateTotalPrice multiplies quantity by price per piece", () => {
    expect(calculateTotalPrice(500, 15)).toBe(7500);
  });

  it("calculateTotalFabric multiplies quantity by fabric per piece", () => {
    expect(calculateTotalFabric(500, 80)).toBe(40000);
  });

  it.each([
    { work: 20000, paid: 15000, balance: 5000, meaning: "owed to the factory" },
    { work: 20000, paid: 25000, balance: -5000, meaning: "owed to the trader" },
    { work: 20000, paid: 20000, balance: 0, meaning: "settled" },
  ])("calculateBalance($work, $paid) = $balance ($meaning)", ({ work, paid, balance }) => {
    expect(calculateBalance(work, paid)).toBe(balance);
  });
});

describe("sortModelsByDate", () => {
  it("sorts oldest first without changing the original array", () => {
    const later = makeModel({ id: "later", date: "2026-10-05" });
    const earlier = makeModel({ id: "earlier", date: "2026-10-01" });
    const original = [later, earlier];

    expect(sortModelsByDate(original).map((m) => m.id)).toEqual(["earlier", "later"]);
    expect(original.map((m) => m.id)).toEqual(["later", "earlier"]);
  });

  it("keeps the sheet order for models on the same day", () => {
    const first = makeModel({ id: "first", date: "2026-10-01" });
    const second = makeModel({ id: "second", date: "2026-10-01" });

    expect(sortModelsByDate([first, second]).map((m) => m.id)).toEqual(["first", "second"]);
  });
});

// Shared data: two models and three payments (one of them before the first model)
const A = makeModel({ id: "A", date: "2026-10-01", quantity: 50, totalPrice: 3000, totalFabricCm: 5850 });
const B = makeModel({ id: "B", date: "2026-10-05", quantity: 55, totalPrice: 3025, totalFabricCm: 8525 });
const P1 = makePayment({ id: "P1", date: "2026-09-28", amount: 1000 }); // before model A
const P2 = makePayment({ id: "P2", date: "2026-10-02", amount: 2000 });
const P3 = makePayment({ id: "P3", date: "2026-10-10", amount: 500 });
const models = [A, B];
const payments = [P1, P2, P3];

const summary = (
  options: Partial<Parameters<typeof calculateSummary>[2]> = {},
  m = models,
  p = payments,
) =>
  calculateSummary(m, p, {
    startModelId: "A",
    endModelId: null,
    paymentsEndDate: null,
    ...options,
  });

describe("calculateSummary", () => {
  it.each([
    { name: "from the first model to the end", options: {}, work: 6025, paid: 2500, balance: 3525 },
    { name: "from the second model", options: { startModelId: "B" }, work: 3025, paid: 500, balance: 2525 },
    { name: "payments stop at a chosen day", options: { paymentsEndDate: "2026-10-02" }, work: 6025, paid: 2000, balance: 4025 },
    { name: "end model limits the models only", options: { endModelId: "A" }, work: 3000, paid: 2500, balance: 500 },
  ])("$name", ({ options, work, paid, balance }) => {
    const result = summary(options);
    expect(result.totalWork).toBe(work);
    expect(result.totalPayments).toBe(paid);
    expect(result.balance).toBe(balance);
  });

  it("sums pieces and fabric over the selected models", () => {
    const result = summary();
    expect(result.totalPieces).toBe(105);
    expect(result.totalFabricCm).toBe(14375);
  });

  it("does not count payments made before the start model's date", () => {
    expect(summary().totalPayments).toBe(2500); // P1 (1000) is excluded
  });

  it("counts a payment made on the start model's own date", () => {
    const sameDay = makePayment({ date: "2026-10-01", amount: 300 });
    expect(summary({}, models, [sameDay]).totalPayments).toBe(300);
  });

  it("counts every payment on the chosen end day", () => {
    const morning = makePayment({ date: "2026-10-02", amount: 100 });
    const evening = makePayment({ date: "2026-10-02", amount: 200 });
    const next = makePayment({ date: "2026-10-03", amount: 400 });

    const result = summary({ paymentsEndDate: "2026-10-02" }, models, [morning, evening, next]);
    expect(result.totalPayments).toBe(300);
  });

  it.each([
    { name: "start model after the end model", options: { startModelId: "B", endModelId: "A" } },
    { name: "unknown start model", options: { startModelId: "does-not-exist" } },
    { name: "unknown end model", options: { endModelId: "does-not-exist" } },
  ])("returns zeros for an invalid selection: $name", ({ options }) => {
    expect(summary(options)).toEqual({
      totalWork: 0,
      totalPayments: 0,
      balance: 0,
      totalPieces: 0,
      totalFabricCm: 0,
    });
  });

  it("counts payments on their own when there are no models (balance goes negative)", () => {
    const result = summary({}, [], payments);
    expect(result.totalWork).toBe(0);
    expect(result.totalPayments).toBe(3500);
    expect(result.balance).toBe(-3500);
  });

  it("returns zeros when there is no data at all", () => {
    expect(summary({}, [], []).balance).toBe(0);
  });

  it("does not change the arrays it receives", () => {
    const copyOfModels = [...models];
    const copyOfPayments = [...payments];
    summary();
    expect(models).toEqual(copyOfModels);
    expect(payments).toEqual(copyOfPayments);
  });
});

describe("settlements (settledUpTo)", () => {
  const M1 = makeModel({ id: "M1", date: "2026-06-25", quantity: 10, totalPrice: 1000 });
  const M2 = makeModel({ id: "M2", date: "2026-07-05", quantity: 20, totalPrice: 2000 });
  const M3 = makeModel({ id: "M3", date: "2026-07-20", quantity: 30, totalPrice: 3000 });
  const p1 = makePayment({ date: "2026-06-20", amount: 400 });
  const p2 = makePayment({ date: "2026-06-30", amount: 100 }); // on the settlement day
  const p3 = makePayment({ date: "2026-07-10", amount: 1500 });
  const p4 = makePayment({ date: "2026-07-25", amount: 500 });
  const all = [M1, M2, M3];
  const pays = [p1, p2, p3, p4];

  const settled = (options: Partial<Parameters<typeof calculateSummary>[2]>, m = all, p = pays) =>
    calculateSummary(m, p, {
      startModelId: "M2",
      endModelId: null,
      paymentsEndDate: null,
      settledUpTo: "2026-06-30",
      ...options,
    });

  it("without a settlement everything counts", () => {
    const result = calculateSummary(all, pays, {
      startModelId: "M1",
      endModelId: null,
      paymentsEndDate: null,
    });
    expect([result.totalWork, result.totalPayments, result.balance, result.totalPieces]).toEqual([6000, 2100, 3900, 60]);
  });

  it("counts only what comes after the settlement day", () => {
    const result = settled({});
    expect([result.totalWork, result.totalPayments, result.balance, result.totalPieces]).toEqual([5000, 2000, 3000, 50]);
  });

  it("excludes a model and a payment dated exactly on the settlement day", () => {
    const onTheDay = makeModel({ date: "2026-06-30", totalPrice: 777, quantity: 7 });
    const result = settled({}, [...all, onTheDay]);
    expect(result.totalWork).toBe(5000);
    expect(result.totalPayments).toBe(2000); // p2 (100) is excluded
  });

  it("still lets the payments end day and the end model limit the period", () => {
    expect(settled({ paymentsEndDate: "2026-07-10" }).balance).toBe(3500);
    expect(settled({ endModelId: "M2" }).balance).toBe(0);
  });

  it("returns zeros when nothing is left after the settlement", () => {
    const result = settled({ startModelId: "", settledUpTo: "2026-07-31" });
    expect(result.totalWork).toBe(0);
    expect(result.totalPayments).toBe(0);
    expect(result.balance).toBe(0);
  });

  it("goes negative when only payments were made after the settlement", () => {
    const result = settled({ startModelId: "", settledUpTo: "2026-07-22" });
    expect(result.totalWork).toBe(0);
    expect(result.totalPayments).toBe(500);
    expect(result.balance).toBe(-500);
  });

  it("does not let a model dated on the settlement day be chosen as the start (it is already settled)", () => {
    const onTheDay = makeModel({ id: "on-the-day", date: "2026-06-30", totalPrice: 777 });
    const result = settled({ startModelId: "on-the-day" }, [...all, onTheDay]);
    expect(result.totalWork).toBe(0);
    expect(result.balance).toBe(0);
  });

  it("does not count a payment made on the settlement day when only payments remain", () => {
    const onTheDay = makePayment({ date: "2026-07-22", amount: 50 });
    const result = settled({ startModelId: "", settledUpTo: "2026-07-22" }, all, [...pays, onTheDay]);
    expect(result.totalPayments).toBe(500); // p4 only; the 50 paid on the settlement day is already settled
  });

  it("selectPeriod returns the same models and payments the summary uses", () => {
    const { periodModels, periodPayments } = selectPeriod(all, pays, {
      startModelId: "M2",
      endModelId: null,
      paymentsEndDate: null,
      settledUpTo: "2026-06-30",
    });
    expect(periodModels.map((m) => m.id)).toEqual(["M2", "M3"]);
    expect(periodPayments).toEqual([p3, p4]);
  });
});

describe("summarizeUpTo (settlement preview)", () => {
  const M1 = makeModel({ date: "2026-06-25", quantity: 10, totalPrice: 1000 });
  const M2 = makeModel({ date: "2026-07-05", quantity: 20, totalPrice: 2000 });
  const pays = [
    makePayment({ date: "2026-06-20", amount: 400 }),
    makePayment({ date: "2026-06-30", amount: 100 }),
    makePayment({ date: "2026-07-10", amount: 1500 }),
  ];

  it("sums everything up to the given day", () => {
    const result = summarizeUpTo([M1, M2], pays, null, "2026-06-30");
    expect([result.totalWork, result.totalPayments, result.balance, result.totalPieces]).toEqual([1000, 500, 500, 10]);
  });

  it("starts after the previous settlement", () => {
    const result = summarizeUpTo([M1, M2], pays, "2026-06-30", "2026-07-31");
    expect([result.totalWork, result.totalPayments, result.balance]).toEqual([2000, 1500, 500]);
  });

  it("includes the last day itself", () => {
    expect(summarizeUpTo([M1, M2], pays, null, "2026-07-05").totalWork).toBe(3000);
    expect(summarizeUpTo([M1, M2], pays, null, "2026-07-04").totalWork).toBe(1000);
  });
});

describe("hasDataAfter", () => {
  const m = [makeModel({ date: "2026-10-01" })];
  const p = [makePayment({ date: "2026-10-05" })];

  it("is false when the date is after everything", () => {
    expect(hasDataAfter(m, p, "2026-10-31")).toBe(false);
  });

  it("is true when a later model exists", () => {
    expect(hasDataAfter(m, [], "2026-09-30")).toBe(true);
  });

  it("is true when only a later payment exists", () => {
    expect(hasDataAfter(m, p, "2026-10-02")).toBe(true);
  });

  it("is false when the date is the same day as the last record", () => {
    expect(hasDataAfter(m, p, "2026-10-05")).toBe(false);
  });
});

describe("lastDayOfMonth", () => {
  it.each([
    ["2026-01", "2026-01-31"],
    ["2026-06", "2026-06-30"],
    ["2026-02", "2026-02-28"],
    ["2028-02", "2028-02-29"], // leap year
    ["2100-02", "2100-02-28"], // divisible by 100 but not by 400
    ["2026-12", "2026-12-31"],
  ])("%s → %s", (month, expected) => {
    expect(lastDayOfMonth(month)).toBe(expected);
  });
});

describe("weekStart (weeks start on Saturday)", () => {
  it.each([
    ["2026-10-03", "2026-10-03", "Saturday starts its own week"],
    ["2026-10-04", "2026-10-03", "Sunday"],
    ["2026-10-09", "2026-10-03", "Friday is the last day of the week"],
    ["2026-10-10", "2026-10-10", "next Saturday starts a new week"],
    ["2026-10-02", "2026-09-26", "Friday belongs to the previous week"],
    ["2027-01-01", "2026-12-26", "a week that crosses the new year"],
    ["2026-10-04T21:00:00.000Z", "2026-10-03", "full ISO strings use their date part"],
  ])("%s → %s (%s)", (date, expected) => {
    expect(weekStart(date)).toBe(expected);
  });
});

describe("groupByWeek", () => {
  it("returns an empty list when there is no data", () => {
    expect(groupByWeek([], [])).toEqual([]);
  });

  it("sums work and payments per week and calculates the net", () => {
    const weeks = groupByWeek(
      [
        makeModel({ date: "2026-10-01", totalPrice: 3000 }),
        makeModel({ date: "2026-10-05", totalPrice: 3025 }),
      ],
      [
        makePayment({ date: "2026-09-28", amount: 1000 }),
        makePayment({ date: "2026-10-02", amount: 2000 }),
        makePayment({ date: "2026-10-10", amount: 500 }),
      ],
    );

    expect(weeks).toEqual([
      { weekStart: "2026-09-26", work: 3000, payments: 3000, net: 0 },
      { weekStart: "2026-10-03", work: 3025, payments: 0, net: 3025 },
      { weekStart: "2026-10-10", work: 0, payments: 500, net: -500 },
    ]);
  });

  it("fills weeks without any activity with zeros", () => {
    const weeks = groupByWeek(
      [makeModel({ date: "2026-10-01", totalPrice: 100 }), makeModel({ date: "2026-10-16", totalPrice: 100 })], // Friday: still the week of 10-10
      [],
    );

    expect(weeks.map((w) => w.weekStart)).toEqual(["2026-09-26", "2026-10-03", "2026-10-10"]);
    expect(weeks[1]).toEqual({ weekStart: "2026-10-03", work: 0, payments: 0, net: 0 });
  });

  it("orders the weeks from oldest to newest regardless of input order", () => {
    const weeks = groupByWeek(
      [makeModel({ date: "2026-10-17", totalPrice: 1 }), makeModel({ date: "2026-10-01", totalPrice: 1 })],
      [],
    );
    expect(weeks[0].weekStart < weeks[weeks.length - 1].weekStart).toBe(true);
  });
});
