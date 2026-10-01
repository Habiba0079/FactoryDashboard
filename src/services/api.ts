import type {
  Model,
  NewModelData,
  NewPaymentData,
  Payment,
  Summary,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL as string;
const API_TOKEN = (import.meta.env.VITE_API_TOKEN as string | undefined) ?? "";

/** القراءة: GET */
async function get<T>(action: string): Promise<T> {
  const response = await fetch(`${API_URL}?action=${action}`, {
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Failed to fetch ${action}`);

  const result = await response.json();

  // الـ Apps Script بيرجّع { success:false, message } عند الأخطاء
  if (result && typeof result === "object" && result.success === false) {
    throw new Error(result.message || `Failed to fetch ${action}`);
  }

  return result as T;
}

/**
 * الكتابة: POST.
 * بنبعت Content-Type: text/plain عشان الطلب يبقى "simple request"
 * ومايحصلش CORS preflight (Apps Script مابيدعمش OPTIONS).
 */
async function post<T>(action: string, payload: object): Promise<T> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: API_TOKEN, ...payload }),
  });

  if (!response.ok) throw new Error(`Request failed: ${action}`);

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || `Request failed: ${action}`);
  }

  return result.data as T;
}

// ---------- Read ----------
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
