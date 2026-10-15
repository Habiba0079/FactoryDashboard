import type {
  AllData,
  Model,
  NewModelData,
  NewPaymentData,
  Payment,
  Settlement,
  Summary,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL as string;
const API_TOKEN = (import.meta.env.VITE_API_TOKEN as string | undefined) ?? "";

async function get<T>(action: string): Promise<T> {
  const response = await fetch(`${API_URL}?action=${action}`, {
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Failed to fetch ${action}`);

  const result = await response.json();

  // Apps Script returns { success: false, message } when a request fails.
  if (result && typeof result === "object" && result.success === false) {
    throw new Error(result.message || `Failed to fetch ${action}`);
  }

  return result as T;
}

/**
 * Send writes using GET with the API token. Apps Script POST responses were
 * unreliable after redirects, sometimes reporting an error even when the
 * spreadsheet row had been saved. Disable caching and do not retry automatically.
 */
async function post<T>(action: string, payload: object): Promise<T> {
  const params = new URLSearchParams({ action, token: API_TOKEN });

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, String(value));
  });

  const response = await fetch(`${API_URL}?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Request failed: ${action}`);

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || `Request failed: ${action}`);
  }

  return result.data as T;
}

// ---------- Read ----------
/** Fetch models, payments, and settlements in one request. */
export const getAll = () => get<AllData>("all");
export const getModels = () => get<Model[]>("models");
export const getPayments = () => get<Payment[]>("payments");
export const getSummary = () => get<Summary>("summary");

// ---------- Models ----------
export const createModel = (data: NewModelData) =>
  post<Model>("addModel", data);

export const updateModel = (id: string, data: NewModelData) =>
  post<Model>("updateModel", { id, ...data });

export const deleteModel = (id: string) =>
  post<{ id: string }>("deleteModel", { id });

// ---------- Payments ----------
export const createPayment = (data: NewPaymentData) =>
  post<Payment>("addPayment", data);

export const updatePayment = (id: string, data: NewPaymentData) =>
  post<Payment>("updatePayment", { id, ...data });

export const deletePayment = (id: string) =>
  post<{ id: string }>("deletePayment", { id });

// ---------- Settlements ----------
export const createSettlement = (data: { date: string; notes?: string }) =>
  post<Settlement>("addSettlement", data);

export const deleteSettlement = (id: string) =>
  post<{ id: string }>("deleteSettlement", { id });
