import { describe, expect, it } from "vitest";
import type { NewModelData, NewPaymentData } from "../src/types";
import { hasErrors, validateModel, validatePayment } from "../src/utils/validation";

const validModel: NewModelData = {
  date: "2026-10-01",
  modelName: "بنطلون",
  quantity: 10,
  pricePerPiece: 50,
  fabricCm: 100,
};

const validPayment: NewPaymentData = { date: "2026-10-01", amount: 1000, notes: "" };

describe("validateModel", () => {
  it("accepts valid data", () => {
    expect(validateModel(validModel)).toEqual({});
  });

  it("requires a date", () => {
    expect(validateModel({ ...validModel, date: "" }).date).toBeDefined();
  });

  it.each(["", "   "])("requires a model name (%j)", (modelName) => {
    expect(validateModel({ ...validModel, modelName }).modelName).toBeDefined();
  });

  it.each(["quantity", "pricePerPiece", "fabricCm"] as const)(
    "%s must be greater than zero",
    (field) => {
      for (const bad of [0, -5, NaN]) {
        expect(validateModel({ ...validModel, [field]: bad })[field]).toBeDefined();
      }
      expect(validateModel({ ...validModel, [field]: 0.5 })[field]).toBeUndefined();
    },
  );

  it("reports every problem at once", () => {
    const errors = validateModel({ date: "", modelName: "", quantity: 0, pricePerPiece: 0, fabricCm: 0 });
    expect(Object.keys(errors).sort()).toEqual(["date", "fabricCm", "modelName", "pricePerPiece", "quantity"]);
  });
});

describe("validatePayment", () => {
  it("accepts valid data, with or without notes", () => {
    expect(validatePayment(validPayment)).toEqual({});
    expect(validatePayment({ date: "2026-10-01", amount: 5 })).toEqual({});
  });

  it("requires a date", () => {
    expect(validatePayment({ ...validPayment, date: "" }).date).toBeDefined();
  });

  it.each([0, -1, NaN])("rejects the amount %s", (amount) => {
    expect(validatePayment({ ...validPayment, amount }).amount).toBeDefined();
  });
});

describe("hasErrors", () => {
  it("is false for an empty object and true otherwise", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ date: "required" })).toBe(true);
  });
});
