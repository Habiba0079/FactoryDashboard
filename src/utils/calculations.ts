import type { Model, Payment, Summary } from "../types";

export const calculateTotalPrice = (quantity: number, pricePerPiece: number) =>
  quantity * pricePerPiece;

export const calculateTotalFabric = (quantity: number, fabricCm: number) =>
  quantity * fabricCm;

export const calculateBalance = (totalWork: number, totalPayments: number) =>
  totalWork - totalPayments;

interface SummaryOptions {
  startModelId: string;
  endModelId: string | null;
  paymentsEndDate: string | null;
}

export function calculateSummary(
  models: Model[],
  payments: Payment[],
  { startModelId, endModelId, paymentsEndDate }: SummaryOptions,
): Summary {
  const sorted = [...models].sort((a, b) => a.date.localeCompare(b.date));
  const startIndex = sorted.findIndex((m) => m.id === startModelId);

  const endIndex = endModelId
    ? sorted.findIndex((m) => m.id === endModelId)
    : sorted.length - 1;

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    return {
      totalWork: 0,
      totalPayments: 0,
      balance: 0,
      totalPieces: 0,
      totalFabricCm: 0,
    };
  }

  const periodModels = sorted.slice(startIndex, endIndex + 1);
  const startDate = sorted[startIndex].date;

  const periodPayments = payments.filter(
    (p) =>
      p.date >= startDate &&
      (paymentsEndDate === null || p.date <= paymentsEndDate),
  );

  const totalWork = periodModels.reduce(
    (sum, model) => sum + model.totalPrice,
    0,
  );
  const totalPayments = periodPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const balance = calculateBalance(totalWork, totalPayments);
  const totalPieces = periodModels.reduce(
    (sum, model) => sum + model.quantity,
    0,
  );
  const totalFabricCm = periodModels.reduce(
    (sum, model) => sum + model.totalFabricCm,
    0,
  );
  return {
    totalWork,
    totalPayments,
    balance,
    totalPieces,
    totalFabricCm,
  };
}
