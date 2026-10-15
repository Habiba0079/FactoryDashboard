import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getAll } from "../services/api";
import type { Model, Payment, Settlement } from "../types";
import { DataContext } from "./dataContext";

const CACHE_KEY = "factory-accounts-cache-v1";
const STALE_AFTER_MS = 2 * 60 * 1000; // Refresh data when returning to the app after two minutes.

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
 * Centralizes application data:
 * - Displays the locally cached copy immediately and refreshes it from the sheet in the background.
 * - Keeps data available while navigating between pages.
 */
function DataProvider({ children }: { children: ReactNode }) {
  const [cache] = useState(readCache);
  const [models, setModels] = useState<Model[]>(cache?.models ?? []);
  const [payments, setPayments] = useState<Payment[]>(cache?.payments ?? []);
  const [settlements, setSettlements] = useState<Settlement[]>(
    cache?.settlements ?? [],
  );
  const [hasData, setHasData] = useState(cache !== null);
  const [refreshing, setRefreshing] = useState(true);
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

  // Cache the data locally for faster startup next time.
  useEffect(() => {
    if (!hasData) return;
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ models, payments, settlements }),
      );
    } catch {
      // Caching is optional; the application remains usable if storage is unavailable.
    }
  }, [models, payments, settlements, hasData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }, []);

  // Refresh automatically when the app becomes visible after the cache has gone stale.
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
