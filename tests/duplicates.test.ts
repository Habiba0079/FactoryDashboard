import { describe, expect, it } from "vitest";
import { makeModel, makePayment } from "./factories";
import type { NewModelData, NewPaymentData } from "../src/types";
import { findDuplicateModel, findDuplicatePayment } from "../src/utils/duplicates";

const newModel = (overrides: Partial<NewModelData> = {}): NewModelData => ({
  date: "2026-10-01",
  modelName: "بنطلون",
  quantity: 10,
  pricePerPiece: 50,
  fabricCm: 100,
  ...overrides,
});

const newPayment = (overrides: Partial<NewPaymentData> = {}): NewPaymentData => ({
  date: "2026-10-01",
  amount: 1000,
  notes: "",
  ...overrides,
});

describe("findDuplicateModel", () => {
  it("returns null when there are no models", () => {
    expect(findDuplicateModel([], newModel())).toBeNull();
  });

  it("returns null when the name is different", () => {
    const models = [makeModel({ modelName: "قميص" })];
    expect(findDuplicateModel(models, newModel())).toBeNull();
  });

  it("returns the existing model when date, name, quantity and price all match", () => {
    const existing = makeModel();
    expect(findDuplicateModel([existing], newModel())).toBe(existing);
  });

  it("ignores extra spaces and letter case in the name", () => {
    const existing = makeModel({ modelName: "Cargo  Pants" });
    expect(
      findDuplicateModel([existing], newModel({ modelName: "  cargo pants " })),
    ).toBe(existing);
  });

  it("returns null when the quantity is different", () => {
    const models = [makeModel({ quantity: 11 })];
    expect(findDuplicateModel(models, newModel())).toBeNull();
  });

  it("returns null when the price per piece is different", () => {
    const models = [makeModel({ pricePerPiece: 60 })];
    expect(findDuplicateModel(models, newModel())).toBeNull();
  });

  it("returns null when the date is different", () => {
    const models = [makeModel({ date: "2026-10-02" })];
    expect(findDuplicateModel(models, newModel())).toBeNull();
  });

  it("does not count fabric per piece as part of the identity", () => {
    const existing = makeModel({ fabricCm: 999 });
    expect(findDuplicateModel([existing], newModel({ fabricCm: 100 }))).toBe(existing);
  });

  it("does not treat the model being edited as its own duplicate", () => {
    const existing = makeModel();
    expect(findDuplicateModel([existing], newModel(), existing.id)).toBeNull();
  });

  it("still finds a different model with the same data while editing", () => {
    const beingEdited = makeModel();
    const other = makeModel();
    expect(findDuplicateModel([beingEdited, other], newModel(), beingEdited.id)).toBe(other);
  });

  it("compares dates by day even when the stored date is a full ISO string", () => {
    const existing = makeModel({ date: "2026-10-01T00:00:00.000Z" });
    expect(findDuplicateModel([existing], newModel())).toBe(existing);
  });
});

describe("findDuplicatePayment", () => {
  it("returns null when there are no payments", () => {
    expect(findDuplicatePayment([], newPayment())).toBeNull();
  });

  it("returns the existing payment when date, amount and notes all match", () => {
    const existing = makePayment();
    expect(findDuplicatePayment([existing], newPayment())).toBe(existing);
  });

  it("returns null when the amount is different", () => {
    const payments = [makePayment({ amount: 2000 })];
    expect(findDuplicatePayment(payments, newPayment())).toBeNull();
  });

  it("returns null when the date is different", () => {
    const payments = [makePayment({ date: "2026-10-02" })];
    expect(findDuplicatePayment(payments, newPayment())).toBeNull();
  });

  it("treats different notes as different payments (e.g. two rent payments)", () => {
    const payments = [makePayment({ notes: "ايجار شهر 7" })];
    expect(findDuplicatePayment(payments, newPayment({ notes: "ايجار شهر 8" }))).toBeNull();
  });

  it("treats missing notes and empty notes as the same", () => {
    const existing = makePayment({ notes: undefined });
    expect(findDuplicatePayment([existing], newPayment({ notes: "" }))).toBe(existing);
  });

  it("ignores extra spaces around the notes", () => {
    const existing = makePayment({ notes: "نقدي" });
    expect(findDuplicatePayment([existing], newPayment({ notes: "  نقدي " }))).toBe(existing);
  });

  it("does not treat the payment being edited as its own duplicate", () => {
    const existing = makePayment();
    expect(findDuplicatePayment([existing], newPayment(), existing.id)).toBeNull();
  });
});
