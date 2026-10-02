import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getAll } from "../services/api";
import type { Model, Payment, Settlement } from "../types";
import { DataContext } from "./dataContext";

const CACHE_KEY = "factory-accounts-cache-v1";
const STALE_AFTER_MS = 2 * 60 * 1000; // بنحدّث لما نرجع للتطبيق بعد دقيقتين

interface Cache {
  models: Model[];
  payments: Payment[];
  settlements: Settlement[];
}

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch {
    return null;
  }
}

/**
 * مكان واحد للبيانات كلها:
 * - بنعرض آخر نسخة محفوظة على الجهاز فورًا، وبنحدّث من الشيت في الخلفية
 * - التنقل بين الصفحات مابيحمّلش من جديد
 */
function DataProvider({ children }: { children: ReactNode }) {
  const [cache] = useState(readCache);
  const [models, setModels] = useState<Model[]>(cache?.models ?? []);
  const [payments, setPayments] = useState<Payment[]>(cache?.payments ?? []);
  const [settlements, setSettlements] = useState<Settlement[]>(
    cache?.settlements ?? [],
  );
  const [hasData, setHasData] = useState(cache !== null);
  const [refreshing, setRefreshing] = useState(true); // بنحمّل أول ما التطبيق يفتح
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const lastFetchedAt = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await getAll();
        if (cancelled) return;
        setModels(data.models);
        setPayments(data.payments);
        setSettlements(data.settlements ?? []);
        setHasData(true);
        setError("");
        lastFetchedAt.current = Date.now();
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("تعذر تحميل البيانات");
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // نحفظ نسخة على الجهاز عشان الفتح الجاي يبقى فوري
  useEffect(() => {
    if (!hasData) return;
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ models, payments, settlements }),
      );
    } catch {
      // التخزين ممتلئ أو ممنوع: مش مشكلة، التطبيق هيشتغل عادي
    }
  }, [models, payments, settlements, hasData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }, []);

  // لما نرجع للتطبيق بعد فترة نحدّث تلقائيًا
  useEffect(() => {
    function onVisible() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastFetchedAt.current > STALE_AFTER_MS
      ) {
        refresh();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const lastSettlementDate =
    settlements.reduce((max, s) => (s.date > max ? s.date : max), "") || null;

  return (
    <DataContext.Provider
      value={{
        models,
        payments,
        settlements,
        setModels,
        setPayments,
        setSettlements,
        hasData,
        loading: !hasData && refreshing,
        refreshing,
        error,
        refresh,
        lastSettlementDate,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export default DataProvider;
