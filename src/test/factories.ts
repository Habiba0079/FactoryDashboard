import type { Model, Payment } from "../types";

let counter = 0;

/** Build a model with sensible defaults. Totals follow quantity/price unless overridden. */
export function makeModel(overrides: Partial<Model> = {}): Model {
  counter += 1;
  const quantity = overrides.quantity ?? 10;
  const pricePerPiece = overrides.pricePerPiece ?? 50;
  const fabricCm = overrides.fabricCm ?? 100;

  return {
    id: `M-${counter}`,
    date: "2026-10-01",
    modelName: "بنطلون",
    quantity,
    pricePerPiece,
    fabricCm,
    totalPrice: quantity * pricePerPiece,
    totalFabricCm: quantity * fabricCm,
    ...overrides,
  };
}

/** Build a payment with sensible defaults. */
export function makePayment(overrides: Partial<Payment> = {}): Payment {
  counter += 1;

  return {
    id: `P-${counter}`,
    date: "2026-10-01",
    amount: 1000,
    notes: "",
    ...overrides,
  };
}
