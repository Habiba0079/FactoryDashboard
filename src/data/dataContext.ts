import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Model, Payment, Settlement } from "../types";

export interface DataContextValue {
  models: Model[];
  payments: Payment[];
  settlements: Settlement[];
  setModels: Dispatch<SetStateAction<Model[]>>;
  setPayments: Dispatch<SetStateAction<Payment[]>>;
  setSettlements: Dispatch<SetStateAction<Settlement[]>>;
  /** Whether cached or remote data is available to display. */
  hasData: boolean;
  /** Whether the initial load is in progress and no cached data is available. */
  loading: boolean;
  /** Whether data is being refreshed in the background. */
  refreshing: boolean;
  error: string;
  refresh: () => void;
  /** Date of the latest settlement, or null if none exists. */
  lastSettlementDate: string | null;
}

export const DataContext = createContext<DataContextValue | null>(null);
