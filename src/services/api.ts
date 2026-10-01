import type { Model, Payment, NewModelData } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

//////////////////////get models and payments//////////////////////////
export async function getModels(): Promise<Model[]> {
  const response = await fetch(`${API_URL}?action=models`);

  if (!response.ok) throw new Error(`Failed to fetch models`);

  return response.json();
}
export async function getPayments(): Promise<Payment[]> {
  const response = await fetch(`${API_URL}?action=payments`);

  if (!response.ok) throw new Error(`Failed to fetch payments`);

  return response.json();
}
///////////////////////add payment//////////////////////////
export async function createPayment(
  data: Omit<Payment, "id">
): Promise<Payment> {
  const params = new URLSearchParams({
    action: "addPayment",
    date: data.date,
    amount: String(data.amount),
    notes: data.notes? data.notes : "",
  });

  const response = await fetch(
    `${API_URL}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to create payment");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message);
  }

  return result.data;
}
////////////////////////add model//////////////////////////
export async function createModel(data: NewModelData): Promise<Model> {
  const params = new URLSearchParams({
    action: "addModel",
    date: data.date,
    modelName: data.modelName,
    quantity: String(data.quantity),
    pricePerPiece: String(data.pricePerPiece),
    fabricCm: String(data.fabricCm),
  });

  const response = await fetch(`${API_URL}?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to create model");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message);
  }

  return result.data;
}
///////////summary//////////

export interface Summary {
  totalWork: number;
  totalPayments: number;
  balance: number;
  totalPieces: number;
  totalFabricCm: number;
}

export async function getSummary(): Promise<Summary> {
  const response = await fetch(`${API_URL}?action=summary`);

  if (!response.ok) {
    throw new Error("Failed to fetch summary");
  }

  return response.json();
}
