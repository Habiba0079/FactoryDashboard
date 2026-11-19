import type { Model, NewModelData, NewPaymentData, Payment } from "../types";

/** Trim, collapse repeated spaces and ignore letter case. */
const normalize = (text: string | undefined) =>
  (text ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/** yyyy-MM-dd, even if the stored value is a full ISO string. */
const day = (date: string) => date.slice(0, 10);

/**
 * Find an existing model that looks like a double entry: same day, name,
 * quantity and price per piece. Fabric per piece is not part of the identity.
 * Pass `ignoreId` when editing, so a model is never a duplicate of itself.
 */
export function findDuplicateModel(
  models: Model[],
  data: NewModelData,
  ignoreId?: string,
): Model | null {
  return (
    models.find(
      (m) =>
        (ignoreId === undefined || m.id !== ignoreId) &&
        day(m.date) === day(data.date) &&
        normalize(m.modelName) === normalize(data.modelName) &&
        m.quantity === data.quantity &&
        m.pricePerPiece === data.pricePerPiece,
    ) ?? null
  );
}

/**
 * Find an existing payment with the same day, amount and notes.
 * Different notes count as different payments (e.g. two monthly rent payments).
 */
export function findDuplicatePayment(
  payments: Payment[],
  data: NewPaymentData,
  ignoreId?: string,
): Payment | null {
  return (
    payments.find(
      (p) =>
        (ignoreId === undefined || p.id !== ignoreId) &&
        day(p.date) === day(data.date) &&
        p.amount === data.amount &&
        normalize(p.notes) === normalize(data.notes),
    ) ?? null
  );
}
