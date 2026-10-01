import type { NewModelData, NewPaymentData } from "../types";

export type Errors<T> = Partial<Record<keyof T, string>>;

export function validateModel(data: NewModelData): Errors<NewModelData> {
  const errors: Errors<NewModelData> = {};

  if (!data.date) errors.date = "التاريخ مطلوب";
  if (!data.modelName.trim()) errors.modelName = "اسم الموديل مطلوب";
  if (!(data.quantity > 0)) errors.quantity = "عدد القطع لازم يكون أكبر من 0";
  if (!(data.pricePerPiece > 0))
    errors.pricePerPiece = "سعر القطعة لازم يكون أكبر من 0";
  if (!(data.fabricCm > 0)) errors.fabricCm = "المتراج لازم يكون أكبر من 0";

  return errors;
}

export function validatePayment(
  data: NewPaymentData
): Errors<NewPaymentData> {
  const errors: Errors<NewPaymentData> = {};

  if (!data.date) errors.date = "التاريخ مطلوب";
  if (!(data.amount > 0)) errors.amount = "قيمة الدفعة لازم تكون أكبر من 0";

  return errors;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;
